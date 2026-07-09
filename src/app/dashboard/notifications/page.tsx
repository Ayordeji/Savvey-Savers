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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            System Notifications
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Live record messages relating to your rotating savings commitments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <CheckSquare size={14} />
              <span>Mark all as Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--status-cancelled)', color: 'var(--status-cancelled)' }}
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
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  borderLeft: n.isRead ? '1px solid var(--border-color)' : '4px solid var(--primary)',
                  backgroundColor: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.03)',
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
                    {n.message}
                  </p>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Calendar size={12} />
                    <span>{formatTime(n.createdAt)}</span>
                  </span>
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
            ))
          )}
        </div>
      )}

      {/* --- NOTIFICATION DETAIL MODAL --- */}
      {selectedNotification && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button onClick={() => setSelectedNotification(null)} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Notification Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              System alert properties.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</span>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.5 }}>
                  {selectedNotification.message}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Triggered On</span>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '4px' }}>
                    {formatTime(selectedNotification.createdAt)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alert Type</span>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '4px', fontFamily: 'monospace' }}>
                    {selectedNotification.type}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => handleDeleteNotification(selectedNotification.id)}
                className="btn btn-secondary"
                style={{ borderColor: 'var(--status-cancelled)', color: 'var(--status-cancelled)' }}
              >
                Delete
              </button>
              <button onClick={() => setSelectedNotification(null)} className="btn btn-secondary">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
