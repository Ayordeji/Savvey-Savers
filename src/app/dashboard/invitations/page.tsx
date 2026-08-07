'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, X, Plus, UserPlus, Mail, Phone, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';
import styles from '../users/users.module.css';

interface User {
  id: string;
  displayId?: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  membership?: string;
  membershipFeeConfirmed?: boolean;
  createdAt: string;
  invitationId?: string;
}

export default function MyInvitationsPage() {
  const dialog = useDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [commitmentsMap, setCommitmentsMap] = useState<Record<string, any>>({});
  const [enabledAmounts, setEnabledAmounts] = useState<any[]>([]);

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [viewUserModal, setViewUserModal] = useState<User | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields for Member Invitation
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMembership, setFormMembership] = useState('Standard Saver');
  const [formAmount, setFormAmount] = useState('100');
  const [formMonth, setFormMonth] = useState('January');
  const [formYear, setFormYear] = useState('2026');

  // Address fields
  const [formAddressLine1, setFormAddressLine1] = useState('');
  const [formAddressLine2, setFormAddressLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPostCode, setFormPostCode] = useState('');
  const [formCountry, setFormCountry] = useState('United Kingdom');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch session
      const sessRes = await fetch('/api/auth/session');
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        if (sessData.loggedIn) setCurrentUser(sessData.user);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users');
      let allUsers = [];
      if (usersRes.ok) {
        allUsers = await usersRes.json();
      }

      // Fetch waiting list (will return referrals if member, or all if admin)
      const wlRes = await fetch('/api/admin/waiting-list');
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        // Merge waitlist entries as pseudo-users
        const wlUsers = wlData.map((w: any) => ({
          id: w.id,
          displayId: 'WL-' + w.id.substring(0, 6).toUpperCase(),
          name: w.name,
          email: w.email,
          phone: w.phone,
          role: 'MEMBER',
          isActive: false, // Pending Approval
          createdAt: w.createdAt,
          invitedBy: w.referredBy,
          // Attach intended commitment info if needed
          _isWaitlist: true
        }));
        allUsers = [...allUsers, ...wlUsers];
      }
      
      setUsers(allUsers);

      // Fetch commitments
      const cmtRes = await fetch('/api/admin/commitments');
      if (cmtRes.ok) {
        const cmts = await cmtRes.json();
        const cMap: Record<string, any> = {};
        if (Array.isArray(cmts)) {
          cmts.forEach((c: any) => {
            if (c.memberId) cMap[c.memberId] = c;
            if (c.memberEmail) cMap[c.memberEmail] = c;
            if (c.memberName) cMap[c.memberName.toLowerCase()] = c;
          });
        }
        setCommitmentsMap(cMap);
      }

      // Fetch settings for enabled commitment amounts
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        const rawAmounts = sData.commitmentAmounts?.filter((a: any) => a.enabled) || [];
        rawAmounts.sort((a: any, b: any) => Number(a.amount) - Number(b.amount));
        setEnabledAmounts(rawAmounts);
        if (rawAmounts.length > 0) {
          setFormAmount(rawAmounts[0].amount.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching invitations page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleOpenInviteModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormMembership('Standard Saver');
    setFormAddressLine1('');
    setFormAddressLine2('');
    setFormCity('');
    setFormPostCode('');
    setFormCountry('United Kingdom');
    if (enabledAmounts.length > 0) {
      setFormAmount(enabledAmounts[0].amount.toString());
    }
    setIsInviteModalOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formFirstName.trim() || !formLastName.trim()) {
      setErrorMsg('First name and last name are required.');
      return;
    }
    if (!formEmail.trim() || !formPhone.trim()) {
      setErrorMsg('Email and phone number are required.');
      return;
    }

    const validateUkPhoneNumber = (phoneStr: string) => {
      if (!phoneStr) return false;
      const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
      if (/^\+44\d{10}$/.test(cleaned)) return true;
      if (/^0\d{10}$/.test(cleaned)) return true;
      if (/^44\d{10}$/.test(cleaned)) return true;
      return false;
    };

    if (!validateUkPhoneNumber(formPhone)) {
      setErrorMsg('Only valid UK phone numbers (e.g. +44 7700 900022 or 07700900022) are accepted.');
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formFirstName.trim() + ' ' + formLastName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          monthlySavingsCommitment: formAmount,
          referredBy: currentUser?.id
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Invitation submitted successfully! Your invitation is now pending Admin approval.');
        fetchInitialData();
        setTimeout(() => {
          setIsInviteModalOpen(false);
          setSuccessMsg('');
        }, 2000);
      } else {
        setErrorMsg(data.error || 'Failed to submit invitation.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred while submitting invitation.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter users by search query and ownership
  const filteredUsers = users.filter((u) => {
    // If current user is a MEMBER, only show users they invited
    if (currentUser?.role === 'MEMBER') {
      const isMyInvite = u.invitedBy === currentUser.id || u.invitedBy === currentUser.invitationId;
      if (!isMyInvite) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.displayId && u.displayId.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const idA = a.displayId || a.id;
    const idB = b.displayId || b.id;
    return sortOrder === 'asc'
      ? idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' })
      : idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
  });

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {/* Page Title Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
            My Invitations
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Invite new members to the Savvey Savers network and track invitation statuses.
          </p>
        </div>

        <button
          onClick={handleOpenInviteModal}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}
        >
          <UserPlus size={18} />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Top Search Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search member name, email or ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="form-input"
            style={{ paddingLeft: '42px', width: '100%', borderRadius: '10px' }}
          />
        </div>
      </div>

      {/* Members & Invitations Table */}
      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Member Invitations...</span>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    style={{ cursor: 'pointer', userSelect: 'none', paddingLeft: '20px' }}
                    title="Click to toggle sorting order"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>Invitation ID</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                        {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
                      </span>
                    </div>
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Created On</th>
                  <th>Is Active</th>
                  <th>Savings Commitment</th>
                  <th>Membership</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No member invitations found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const cmt = commitmentsMap[u.id] || commitmentsMap[u.email] || (u.name ? commitmentsMap[u.name.toLowerCase()] : null);
                    return (
                      <tr key={u.id}>
                        <td style={{ paddingLeft: '20px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {u.displayId || u.id}
                        </td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`status-pill ${u.role === 'ADMIN' ? 'completed' : 'active'}`} style={{ fontSize: '0.7rem' }}>
                            {u.role === 'ADMIN' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                        <td>
                          <span className={`status-pill ${u.isActive ? 'active' : 'pending'}`} style={{ fontSize: '0.7rem' }}>
                            {u.isActive ? 'Active' : 'Pending Approval'}
                          </span>
                        </td>
                        <td>
                          {cmt ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 700, color: '#064e3b', fontSize: '0.85rem' }}>
                                £{Number(cmt.amount).toFixed(2)}/mo
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {cmt.collectionMonth} {cmt.collectionYear}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => setViewUserModal(u)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.85rem'
                            }}
                          >
                            View Membership
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setViewUserModal(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
            itemLabel="member invitation"
          />
        </>
      )}

      {/* --- INVITE MEMBER MODAL --- */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInviteModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '580px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setIsInviteModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Invite New Member
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Fill out the member details below to submit a new member invitation for Admin approval.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priscilla"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Omole"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priscilla@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +447123456789"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Savings Commitment Amount (£)</label>
                  <select value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="form-select">
                    {enabledAmounts.map((a) => (
                      <option key={a.amount} value={a.amount}>£{Number(a.amount).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Preferred Collection Month</label>
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
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Address Line 1</label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={formAddressLine1}
                  onChange={(e) => setFormAddressLine1(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Post Code</label>
                  <input
                    type="text"
                    placeholder="Post code"
                    value={formPostCode}
                    onChange={(e) => setFormPostCode(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  disabled={formSubmitting}
                  className="btn btn-secondary"
                  style={{ borderRadius: '8px', padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}
                >
                  {formSubmitting ? 'Submitting...' : 'Submit Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MEMBER DETAILS MODAL --- */}
      {viewUserModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewUserModal(null); }}>
          <div className="modal-content" style={{ maxWidth: '500px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setViewUserModal(null)} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#2e3a4e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                {viewUserModal.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-family-title)', color: '#0f172a' }}>
                  {viewUserModal.name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  {viewUserModal.email} • {viewUserModal.phone}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Invitation ID</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b', fontFamily: 'monospace' }}>{viewUserModal.displayId || viewUserModal.id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Status</span>
                  <strong style={{ fontSize: '0.9rem', color: viewUserModal.isActive ? '#16a34a' : '#d97706' }}>
                    {viewUserModal.isActive ? 'Active' : 'Pending Approval'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Role</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{viewUserModal.role}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Invited Date</span>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{new Date(viewUserModal.createdAt).toLocaleDateString('en-GB')}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewUserModal(null)} className="btn btn-secondary" style={{ borderRadius: '8px', padding: '8px 22px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
