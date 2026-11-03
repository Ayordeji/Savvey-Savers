'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckSquare, Info, Calendar, X, Trash2 } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  targetUserId?: string;
  link?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const dialog = useDialog();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
 
  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!(await dialog.confirm('Delete Notification', 'Are you sure you want to delete this notification?'))) return;
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNotifications();
        router.refresh();
        setSelectedNotification(null);
      } else {
        await dialog.alert('Error', 'Failed to delete notification.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };
 
  const handleClearAll = async () => {
    if (!(await dialog.confirm('Clear Notifications', 'Are you sure you want to delete all notifications? This action cannot be undone.'))) return;
    try {
      const res = await fetch('/api/admin/notifications', { method: 'DELETE' });
      if (res.ok) {
        fetchNotifications();
        router.refresh();
      } else {
        await dialog.alert('Error', 'Failed to clear notifications.');
      }
    } catch (err) {
      console.error('Clear all error:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
        router.refresh();
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    setSelectedNotification(n);
    if (!n.isRead) {
      try {
        const res = await fetch(`/api/admin/notifications?id=${n.id}`, { method: 'POST' });
        if (res.ok) {
          fetchNotifications();
          router.refresh();
        }
      } catch (err) {
        console.error('Error marking single read:', err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  const formatRecordedDate = (dateStr: string | Date): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const day = d.getDate();
      const month = d.toLocaleDateString('en-GB', { month: 'short' });
      const year = d.getFullYear();
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${day} ${month} ${year}, ${time}`;
    } catch {
      return String(dateStr);
    }
  };

  const parseNotificationDetails = (n: Notification) => {
    const msg = n.message || '';

    // Check if it's an admin activity log — do not format as a member payment receipt!
    const isAdminAction = msg.toLowerCase().startsWith('you successfully recorded') || 
                          msg.toLowerCase().startsWith('user ') ||
                          n.type === 'SYSTEM' ||
                          n.type === 'USER_ADDED';

    if (isAdminAction) {
      return {
        isPayment: false,
        title: 'Admin Activity',
        amount: null,
        monthYear: null,
        body: <span>{msg}</span>,
        listText: msg
      };
    }
    
    // Extract amount: e.g. £500, £500.00, £1,000
    const amountMatch = msg.match(/£([0-9,]+(\.[0-9]{2})?)/);
    const amount = amountMatch ? amountMatch[1].replace(/\.00$/, '') : null;

    // Extract month and year: e.g. October 2026, Oct 2026
    const monthMatch = msg.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
    const monthYear = monthMatch ? `${monthMatch[1]} ${monthMatch[2]}` : null;

    const isMemberPaymentReceipt = n.type === 'PAYMENT_RECORDED' || 
                                  n.type === 'PAYMENT_CONFIRMED' || 
                                  msg.toLowerCase().includes('contribution payment') || 
                                  msg.toLowerCase().includes('past contribution') ||
                                  msg.toLowerCase().startsWith('your payment of');

    if (isMemberPaymentReceipt && amount && monthYear) {
      return {
        isPayment: true,
        title: 'Contribution Payment Recorded',
        amount,
        monthYear,
        body: (
          <span>
            Your contribution payment of <strong>£{amount}</strong> for <strong>{monthYear}</strong> has been recorded in your membership account.
          </span>
        ),
        listText: `Your contribution payment of £${amount} for ${monthYear} has been recorded in your membership account.`
      };
    }

    if (isMemberPaymentReceipt) {
      return {
        isPayment: true,
        title: 'Contribution Payment Recorded',
        amount: amount || '',
        monthYear: monthYear || '',
        body: <span>{msg}</span>,
        listText: msg
      };
    }

    return {
      isPayment: false,
      title: n.type === 'SUPER_ADMIN_REQUEST' ? 'Super Admin Request' : (n.type === 'WAITING_LIST_SIGNUP' ? 'Waiting List Signup' : 'Notification'),
      amount: null,
      monthYear: null,
      body: <span>{msg}</span>,
      listText: msg
    };
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div className="filterContainer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Notifications
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
              <CheckSquare size={14} />
              <span>Mark all as Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--status-cancelled)', color: 'var(--status-cancelled)', whiteSpace: 'nowrap' }}
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Notifications...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.length === 0 ? (
            <div className="glass-panel flex-center" style={{ height: '200px', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
              <Bell size={36} style={{ opacity: 0.3 }} />
              <span>You have no notifications yet</span>
            </div>
          ) : (
            notifications.map((n) => {
              const details = parseNotificationDetails(n);
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    borderLeft: n.isRead ? undefined : '4px solid var(--primary)',
                    backgroundColor: n.isRead ? undefined : 'rgba(99, 102, 241, 0.03)',
                    transition: 'background-color var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    backgroundColor: n.isRead ? 'rgba(255,255,255,0.05)' : 'var(--primary-glow)',
                    color: n.isRead ? 'var(--text-muted)' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Info size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.925rem', fontWeight: n.isRead ? 400 : 600, color: 'var(--text-main)' }}>
                      {details.listText}
                    </p>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <Calendar size={12} />
                      <span>{formatRecordedDate(n.createdAt)}</span>
                    </span>

                    {(n.type === 'SUPER_ADMIN_REQUEST' || n.message.toLowerCase().includes('requested super admin promotion')) && (
                      <div style={{ marginTop: '10px' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            let targetId = n.targetUserId;
                            if (!targetId && n.link) {
                              try {
                                targetId = new URL(n.link).searchParams.get('approveSuperAdmin') || undefined;
                              } catch (err) {}
                            }
                            const confirmApprove = await dialog.confirm(
                              'Approve Super Admin Request',
                              'Are you sure you want to accept and approve this Super Admin promotion? This will grant full Super Admin control to the user.'
                            );
                            if (!confirmApprove) return;

                            try {
                              const res = await fetch('/api/admin/users', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: targetId || 'usr_admin',
                                  isSuperAdmin: true,
                                  role: 'ADMIN',
                                  approveRequest: true
                                })
                              });
                              if (res.ok) {
                                await dialog.alert('Promotion Approved', 'Super Admin privileges have been successfully granted and transferred!');
                                fetchNotifications();
                                router.refresh();
                              } else {
                                const data = await res.json();
                                await dialog.alert('Approval Failed', data.error || 'Failed to approve request.');
                              }
                            } catch (err) {
                              console.error('Approve promotion error:', err);
                              await dialog.alert('Error', 'A network error occurred while approving request.');
                            }
                          }}
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                          }}
                        >
                          ⚡ Accept & Approve Promotion
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {!n.isRead && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color var(--transition-fast), background-color var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--status-cancelled)';
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Delete Notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- NOTIFICATION DETAIL MODAL --- */}
      {selectedNotification && (() => {
        const details = parseNotificationDetails(selectedNotification);
        return (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedNotification(null);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1000
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px 24px 28px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative'
              }}
            >
              {/* Header with Title and Close button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: '#111827',
                    margin: 0,
                    lineHeight: 1.3,
                    fontFamily: 'var(--font-family-title, sans-serif)'
                  }}
                >
                  {details.title}
                </h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  aria-label="Close"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4b5563',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    marginLeft: '12px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Message Body */}
              <div
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  color: '#1f2937',
                  marginBottom: '28px'
                }}
              >
                {details.body}
              </div>

              {/* Metadata rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {details.isPayment ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Recorded by</span>
                      <span style={{ color: '#111827', fontSize: '0.95rem', fontWeight: 500 }}>SSC Admin</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Date recorded</span>
                      <span style={{ color: '#111827', fontSize: '0.95rem', fontWeight: 500 }}>
                        {formatRecordedDate(selectedNotification.createdAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>Date</span>
                    <span style={{ color: '#111827', fontSize: '0.95rem', fontWeight: 500 }}>
                      {formatRecordedDate(selectedNotification.createdAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons if Super Admin Request */}
              {(selectedNotification.type === 'SUPER_ADMIN_REQUEST' || selectedNotification.message.toLowerCase().includes('requested super admin promotion')) && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      let targetId = selectedNotification.targetUserId;
                      if (!targetId && selectedNotification.link) {
                        try {
                          targetId = new URL(selectedNotification.link).searchParams.get('approveSuperAdmin') || undefined;
                        } catch (err) {}
                      }
                      const confirmApprove = await dialog.confirm(
                        'Approve Super Admin Request',
                        'Are you sure you want to accept and approve this Super Admin promotion? This will grant full Super Admin control to the user.'
                      );
                      if (!confirmApprove) return;

                      try {
                        const res = await fetch('/api/admin/users', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: targetId || 'usr_admin',
                            isSuperAdmin: true,
                            role: 'ADMIN',
                            approveRequest: true
                          })
                        });
                        if (res.ok) {
                          await dialog.alert('Promotion Approved', 'Super Admin privileges have been successfully granted and transferred!');
                          setSelectedNotification(null);
                          fetchNotifications();
                          router.refresh();
                        } else {
                          const data = await res.json();
                          await dialog.alert('Approval Failed', data.error || 'Failed to approve request.');
                        }
                      } catch (err) {
                        console.error('Approve promotion error:', err);
                        await dialog.alert('Error', 'A network error occurred while approving request.');
                      }
                    }}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                    }}
                  >
                    ⚡ Accept & Approve Promotion
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
