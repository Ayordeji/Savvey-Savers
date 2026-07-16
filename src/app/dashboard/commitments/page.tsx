'use client';

import { useState, useEffect, Fragment } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X, MoreVertical, BellRing, Check, DollarSign, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import styles from './commitments.module.css';

interface Commitment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  endDate: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

interface Payment {
  id: string;
  commitmentId: string;
  amount: number;
  month: string;
  year: number;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  receiptUrl?: string | null;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export default function SavingsCommitmentsPage() {
  const dialog = useDialog();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: 'ADMIN' | 'MEMBER' } | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Settings configs
  const [goals, setGoals] = useState<{ name: string; enabled: boolean }[]>([]);
  const [amounts, setAmounts] = useState<{ amount: number; enabled: boolean }[]>([]);

  // UI expansion states
  const [expandedCmtId, setExpandedCmtId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<'NONE' | 'ADD' | 'EDIT' | 'REMINDER' | 'PAST_PAYMENT'>('NONE');
  const [selectedCmt, setSelectedCmt] = useState<Commitment | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (!openDropdownId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.actionsDropdown}`)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openDropdownId]);

  // Add/Edit Commitment Fields
  const [formSaverId, setFormSaverId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formMonth, setFormMonth] = useState('January');
  const [formYear, setFormYear] = useState('2026');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');

  // Reminder fields
  const [reminderSaverId, setReminderSaverId] = useState('');
  const [reminderCmtId, setReminderCmtId] = useState('');

  // Past payment fields
  const [pastPayMonth, setPastPayMonth] = useState('January');
  const [pastPayYear, setPastPayYear] = useState('2026');
  const [pastPayAmount, setPastPayAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchInitialData = async () => {
    try {
      // 1. Fetch current user from profile or settings checks
      const meRes = await fetch('/api/admin/users');
      if (meRes.ok) {
        const uList = await meRes.json();
        // Determine logged in profile (usr_admin by default if we are admin, or we can check via login API details)
        // For local development, check who is active. Or write a small auth fetch
        const cmtRes = await fetch('/api/admin/commitments');
        if (cmtRes.ok) {
          const cmtData = await cmtRes.json();
          setCommitments(cmtData);
        }

        // Determine user list
        setUsers(uList.filter((u: any) => u.role === 'MEMBER'));
        
        // Check if there is an active session
        // We will mock fetch to understand if we are Admin or Member
        // Simple heuristic: if we can query full user list (more than 1 admin user, etc), let's check
        // The endpoint /api/admin/users only allows Admin. If it returns 403, we are a Member.
        // Let's check:
        if (meRes.status === 403) {
          setCurrentUser({ id: 'member', role: 'MEMBER' }); // dummy fallback
        } else {
          setCurrentUser({ id: 'usr_admin', role: 'ADMIN' });
        }
      }

      // 2. Fetch settings
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setGoals(sData.savingGoals?.filter((g: any) => g.enabled) || []);
        setAmounts(sData.commitmentAmounts?.filter((a: any) => a.enabled) || []);
      }
    } catch (err) {
      console.error('Error fetching commitments page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (cmtId: string) => {
    try {
      const res = await fetch(`/api/admin/payments?commitmentId=${cmtId}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentsMap((prev) => ({ ...prev, [cmtId]: data }));
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRowClick = (cmtId: string) => {
    if (expandedCmtId === cmtId) {
      setExpandedCmtId(null);
    } else {
      setExpandedCmtId(cmtId);
      fetchPayments(cmtId);
    }
  };

  const handleOpenAddModal = () => {
    setErrorMsg('');
    setFormSaverId(users[0]?.id || '');
    setFormAmount(amounts[0]?.amount.toString() || '100');
    setFormGoal(goals[0]?.name || 'Savings');
    setFormMonth('January');
    setFormYear('2026');
    setActiveModal('ADD');
  };

  const handleOpenReminderModal = () => {
    setErrorMsg('');
    setReminderSaverId(users[0]?.id || '');
    setReminderCmtId('');
    setActiveModal('REMINDER');
  };

  const handleOpenPastPaymentModal = (cmt: Commitment) => {
    setErrorMsg('');
    setSelectedCmt(cmt);
    setPastPayMonth('January');
    setPastPayYear('2026');
    setPastPayAmount(cmt.amount.toString());
    setActiveModal('PAST_PAYMENT');
    setOpenDropdownId(null);
  };

  const handleOpenEditModal = (cmt: Commitment) => {
    setErrorMsg('');
    setSelectedCmt(cmt);
    setFormAmount(cmt.amount.toString());
    setFormGoal(cmt.goal);
    setFormMonth(cmt.collectionMonth);
    setFormYear(cmt.collectionYear.toString());
    setFormStatus(cmt.status);
    setActiveModal('EDIT');
    setOpenDropdownId(null);
  };

  const handleAddSubmit = async (requestCollection: boolean) => {
    setErrorMsg('');
    if (currentUser?.role === 'ADMIN' && !formSaverId) {
      setErrorMsg('Please select a member.');
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch('/api/admin/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser?.role === 'ADMIN' ? formSaverId : undefined,
          amount: formAmount,
          goal: formGoal,
          collectionMonth: formMonth,
          collectionYear: formYear,
          requestCollection
        }),
      });

      if (res.ok) {
        // Refresh commitments
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create commitment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedCmt) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/commitments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCmt.id,
          amount: formAmount,
          goal: formGoal,
          collectionMonth: formMonth,
          collectionYear: formYear,
          status: formStatus
        })
      });

      if (res.ok) {
        // Refresh
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update commitment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!reminderSaverId || !reminderCmtId) {
      setErrorMsg('Please select a member and their active commitment.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_REMINDER',
          memberId: reminderSaverId,
          commitmentId: reminderCmtId
        })
      });

      if (res.ok) {
        await dialog.alert('Reminder Dispatched', 'Friendly savings email reminder dispatched successfully!');
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to send reminder.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePastPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedCmt) return;

    setFormSubmitting(true);
    try {
      let receiptUrl = '';
      if (receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          setErrorMsg(errData.error || 'Failed to upload receipt file.');
          setFormSubmitting(false);
          return;
        }
        const uploadData = await uploadRes.json();
        receiptUrl = uploadData.url;
      }

      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAST_PAYMENT',
          commitmentId: selectedCmt.id,
          month: pastPayMonth,
          year: pastPayYear,
          amount: pastPayAmount,
          receiptUrl
        })
      });

      if (res.ok) {
        fetchPayments(selectedCmt.id);
        setReceiptFile(null);
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to record payment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string, commitmentId: string) => {
    if (!(await dialog.confirm('Confirm Payment', 'Confirm receipt of this contribution payment? This triggers an email receipt.'))) return;
    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PAYMENT',
          paymentId
        })
      });

      if (res.ok) {
        fetchPayments(commitmentId);
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
    }
  };

  const handleReleaseHarvest = async (cmtId: string) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Release Harvest Payout', 'Are you sure you want to release the harvest payout? This will mark the rotating cycle commitment as Completed and notify the member.'))) return;

    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RELEASE_HARVEST',
          commitmentId: cmtId
        })
      });

      if (res.ok) {
        // Refresh commitments
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
      }
    } catch (err) {
      console.error('Error releasing harvest:', err);
    }
  };

  const handleCancelCommitment = async (cmtId: string) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Cancel Commitment', 'Are you sure you want to cancel this savings commitment? The record will be archived in Deleted Records.'))) return;

    try {
      const res = await fetch(`/api/admin/commitments?id=${cmtId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Refresh
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
      }
    } catch (err) {
      console.error('Error deleting commitment:', err);
    }
  };

  const toggleDropdown = (cmtId: string) => {
    setOpenDropdownId(openDropdownId === cmtId ? null : cmtId);
  };

  const filteredCommitments = commitments.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      c.memberName.toLowerCase().includes(q) ||
      c.goal.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    const matchesYear = !yearFilter || c.collectionYear.toString() === yearFilter;

    return matchesSearch && matchesYear;
  });

  const getActiveCommitmentsForMember = (memberId: string) => {
    return commitments.filter((c) => c.memberId === memberId && (c.status === 'ACTIVE' || c.status === 'PENDING'));
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.filterContainer}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Savings Commitments
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Savings agreements, payout schedules, collection month approvals, and payment logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {currentUser?.role === 'ADMIN' && (
            <button onClick={handleOpenReminderModal} className="btn btn-secondary btn-sm">
              <BellRing size={16} />
              <span>Send Reminder</span>
            </button>
          )}
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>New Savings Commitment</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterContainer} style={{ marginBottom: '16px' }}>
        <div className={styles.filtersLeft}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by member name, goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className={`${styles.yearSelect} form-select`}
            style={{ width: '130px' }}
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </div>
      </div>

      {/* Commitments Table */}
      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Commitments...</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Record ID</th>
                <th>Member Name</th>
                <th>Savings Amount</th>
                <th>Savings Goal</th>
                <th>Collection Month</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommitments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No savings commitments found.
                  </td>
                </tr>
              ) : (
                filteredCommitments.map((c) => {
                  const isExpanded = expandedCmtId === c.id;
                  return (
                    <Fragment key={c.id}>
                      <tr className={isExpanded ? styles.expandedRow : ''} style={{ cursor: 'pointer' }}>
                        <td onClick={() => handleRowClick(c.id)} style={{ paddingRight: 0 }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                        <td onClick={() => handleRowClick(c.id)} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {c.id}
                        </td>
                        <td onClick={() => handleRowClick(c.id)} style={{ fontWeight: 600 }}>{c.memberName}</td>
                        <td onClick={() => handleRowClick(c.id)}>£{c.amount}</td>
                        <td onClick={() => handleRowClick(c.id)}>{c.goal}</td>
                        <td onClick={() => handleRowClick(c.id)}>{c.collectionMonth} {c.collectionYear}</td>
                        <td onClick={() => handleRowClick(c.id)}>
                          <span className={`status-pill ${c.status.toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          {currentUser?.role === 'ADMIN' ? (
                            <div className={styles.actionsDropdown}>
                              <button onClick={() => toggleDropdown(c.id)} className={styles.dropdownTrigger}>
                                <MoreVertical size={16} />
                              </button>
                              {openDropdownId === c.id && (
                                <div className={styles.dropdownMenu}>
                                  <button onClick={() => handleOpenEditModal(c)} className={styles.dropdownItem}>
                                    <Edit size={14} />
                                    <span>Edit Commitment</span>
                                  </button>
                                  {c.status !== 'CANCELLED' && (
                                    <button onClick={() => handleOpenPastPaymentModal(c)} className={styles.dropdownItem}>
                                      <DollarSign size={14} />
                                      <span>Record Past Payment</span>
                                    </button>
                                  )}
                                  {c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && (
                                    <button onClick={() => handleReleaseHarvest(c.id)} className={styles.dropdownItem}>
                                      <Check size={14} />
                                      <span>Release Harvest</span>
                                    </button>
                                  )}
                                  {c.status !== 'CANCELLED' && c.status !== 'COMPLETED' && (
                                    <button onClick={() => handleCancelCommitment(c.id)} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                                      <Trash2 size={14} />
                                      <span>Cancel Commitment</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>

                      {/* Row Expanded payment details */}
                      {isExpanded && (
                        <tr className={styles.expandedRow}>
                          <td colSpan={8}>
                            <div className={styles.expandedContainer}>
                              <div className={styles.expandedHeader}>
                                <span className={styles.expandedTitle}>Contribution Log History</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  Detailed offline payments for cycle record ID: {c.id}
                                </span>
                              </div>
                              <div className={styles.paymentsGrid}>
                                {!paymentsMap[c.id] ? (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading payments...</div>
                                ) : paymentsMap[c.id].length === 0 ? (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No payments logged yet.</div>
                                ) : (
                                  paymentsMap[c.id].map((pay) => (
                                    <div key={pay.id} className={styles.paymentCard}>
                                      <div className={styles.paymentMeta}>
                                        <span className={styles.paymentMonth}>{pay.month} {pay.year}</span>
                                        <span className={styles.paymentAmount}>£{pay.amount}</span>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                        {pay.status === 'CONFIRMED' ? (
                                          <span className="status-pill confirmed" style={{ fontSize: '0.65rem' }}>Confirmed</span>
                                        ) : (currentUser?.role === 'ADMIN' && c.status !== 'PENDING' && c.status !== 'CANCELLED') ? (
                                          <button
                                            onClick={() => handleConfirmPayment(pay.id, c.id)}
                                            className="btn btn-primary btn-sm"
                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                          >
                                            Confirm Receipt
                                          </button>
                                        ) : (
                                          <span className="status-pill pending" style={{ fontSize: '0.65rem' }}>Awaiting Confirmation</span>
                                        )}
                                        {pay.receiptUrl && (
                                          <a
                                            href={pay.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary btn-sm"
                                            style={{
                                              padding: '4px 8px',
                                              fontSize: '0.75rem',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              textDecoration: 'none',
                                              borderColor: '#1e3529',
                                              color: '#e2ede5',
                                              backgroundColor: 'rgba(255,255,255,0.05)'
                                            }}
                                          >
                                            View Receipt
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD COMMITMENT MODAL --- */}
      {activeModal === 'ADD' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              New Savings Commitment
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Create a rotating savings cycle agreement with targets and collection dates.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentUser?.role === 'ADMIN' ? (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Savers (Registered Member)</label>
                  <select value={formSaverId} onChange={(e) => setFormSaverId(e.target.value)} className="form-select">
                    <option value="">Select a member...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Saver</label>
                  <input type="text" disabled value="Your Profile" className="form-input" style={{ opacity: 0.7 }} />
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Commitment Amount (£)</label>
                <select value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="form-select">
                  {amounts.map((a) => (
                    <option key={a.amount} value={a.amount}>£{a.amount}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Commitment Goal</label>
                <select value={formGoal} onChange={(e) => setFormGoal(e.target.value)} className="form-select">
                  {goals.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Month</label>
                  <select value={formMonth} onChange={(e) => setFormMonth(e.target.value)} className="form-select">
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Year</label>
                  <select value={formYear} onChange={(e) => setFormYear(e.target.value)} className="form-select">
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleAddSubmit(false)}
                    disabled={formSubmitting}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Save Record
                  </button>
                )}
                <button
                  onClick={() => handleAddSubmit(true)}
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1.2 }}
                >
                  Request Collection Month
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SEND REMINDER MODAL --- */}
      {activeModal === 'REMINDER' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Dispatch Savings Reminder
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Send a friendly transactional email reminder about outstanding commitments.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReminderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savers</label>
                <select
                  value={reminderSaverId}
                  onChange={(e) => {
                    setReminderSaverId(e.target.value);
                    setReminderCmtId('');
                  }}
                  className="form-select"
                >
                  <option value="">Select a member...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {reminderSaverId && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Active Savings Commitment</label>
                  <select
                    value={reminderCmtId}
                    onChange={(e) => setReminderCmtId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select commitment cycle...</option>
                    {getActiveCommitmentsForMember(reminderSaverId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.goal} (£{c.amount}/mo - Payout: {c.collectionMonth})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting || !reminderCmtId} className="btn btn-primary" style={{ flex: 1.2 }}>
                  <BellRing size={16} />
                  <span>{formSubmitting ? 'Sending...' : 'Send Reminder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECORD PAST PAYMENT MODAL --- */}
      {activeModal === 'PAST_PAYMENT' && selectedCmt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Record Past Payment
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Add a historical contribution payment for {selectedCmt.memberName}&apos;s cycle.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePastPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Month</label>
                  <select value={pastPayMonth} onChange={(e) => setPastPayMonth(e.target.value)} className="form-select">
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Year</label>
                  <select value={pastPayYear} onChange={(e) => setPastPayYear(e.target.value)} className="form-select">
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

               <div className="form-group" style={{ margin: 0 }}>
                 <label className="form-label">Payment Amount (£)</label>
                 <input
                   type="number"
                   required
                   min="1"
                   value={pastPayAmount}
                   onChange={(e) => setPastPayAmount(e.target.value)}
                   className="form-input"
                 />
               </div>

               <div className="form-group" style={{ margin: 0 }}>
                 <label className="form-label">Receipt / Document (Optional)</label>
                 <input
                   type="file"
                   accept="image/*,application/pdf"
                   onChange={(e) => {
                     const files = e.target.files;
                     if (files && files.length > 0) {
                       setReceiptFile(files[0]);
                     } else {
                       setReceiptFile(null);
                     }
                   }}
                   className="form-input"
                   style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                 />
               </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {formSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT COMMITMENT MODAL --- */}
      {activeModal === 'EDIT' && selectedCmt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Edit Commitment Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Modify settings for commitment cycle ID: {selectedCmt.id}.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Target Goal</label>
                <select value={formGoal} onChange={(e) => setFormGoal(e.target.value)} className="form-select">
                  {goals.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Monthly Amount (£)</label>
                <select value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="form-select">
                  {amounts.map((a) => (
                    <option key={a.amount} value={a.amount}>£{a.amount}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Month</label>
                  <select value={formMonth} onChange={(e) => setFormMonth(e.target.value)} className="form-select">
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Year</label>
                  <select value={formYear} onChange={(e) => setFormYear(e.target.value)} className="form-select">
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cycle Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="form-select">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
