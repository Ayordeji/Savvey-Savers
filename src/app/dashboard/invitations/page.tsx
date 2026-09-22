'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, X, Plus, UserPlus, Mail, Phone, ShieldCheck, CheckCircle2, CheckCircle, AlertCircle, Clock, ChevronDown, MoreVertical, Copy, Send, Check } from 'lucide-react';
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
  invitedBy?: string;
}

export default function MyInvitationsPage() {
  const dialog = useDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [commitmentsMap, setCommitmentsMap] = useState<Record<string, any>>({});
  const [enabledAmounts, setEnabledAmounts] = useState<any[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
          displayId: w.displayId || w.id,
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

  const [formRole, setFormRole] = useState<'MEMBER' | 'ADMIN' | 'SUPER_ADMIN'>('MEMBER');
  const [formPermissions, setFormPermissions] = useState<string[]>(['INVITE_USER', 'ASSIGN_UNAVAILABLE_MONTH']);

  const handlePermissionChange = (perm: string, checked: boolean) => {
    if (checked) {
      setFormPermissions((prev) => [...prev, perm]);
    } else {
      setFormPermissions((prev) => prev.filter((p) => p !== perm));
    }
  };

  const handleOpenInviteModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('MEMBER');
    setFormMembership('Standard Saver');
    setFormAddressLine1('');
    setFormAddressLine2('');
    setFormCity('');
    setFormPostCode('');
    setFormCountry('United Kingdom');
    setFormPermissions(['INVITE_USER', 'ASSIGN_UNAVAILABLE_MONTH']);
    if (enabledAmounts.length > 0) {
      setFormAmount(enabledAmounts[0].amount.toString());
    }
    setIsInviteModalOpen(true);
  };

  const handleAddSubmit = async (inviteMode: 'SAVE' | 'SAVE_INVITE') => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!formFirstName.trim()) {
      setErrorMsg('First Name is required.');
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
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole,
          membership: formMembership,
          addressLine1: formAddressLine1.trim(),
          addressLine2: formAddressLine2.trim(),
          city: formCity.trim(),
          postCode: formPostCode.trim(),
          country: formCountry.trim(),
          permissions: formPermissions,
          inviteMode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(inviteMode === 'SAVE' ? 'User added successfully!' : 'User added and invitation email sent successfully!');
        fetchInitialData();
        setTimeout(() => {
          setIsInviteModalOpen(false);
        }, 2000);
      } else {
        setErrorMsg(data.error || 'Failed to add user.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred while adding user.');
    } finally {
      setFormSubmitting(false);
    }
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

  // Filter users by search query, status, role, and ownership
  const filteredUsers = users.filter((u) => {
    if (currentUser?.role === 'MEMBER') {
      const myKeys = [
        currentUser.id,
        currentUser.displayId,
        currentUser.invitationId,
        currentUser.email
      ].filter(Boolean).map(k => String(k).toLowerCase().trim());

      const inviteKey = u.invitedBy ? String(u.invitedBy).toLowerCase().trim() : '';
      const isMyInvite = inviteKey && myKeys.includes(inviteKey);
      if (!isMyInvite) return false;
    }

    if (statusFilter) {
      if (statusFilter === 'ACCEPTED' && !u.isActive) return false;
      if (statusFilter === 'PENDING' && u.isActive) return false;
      if (statusFilter === 'EXPIRED' || statusFilter === 'DECLINED') return false;
    }

    if (roleFilter && u.role !== roleFilter) {
      return false;
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedUsers.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const totalInvitesCount = users.length;
  const acceptedInvitesCount = users.filter(u => u.isActive).length;
  const pendingInvitesCount = users.filter(u => !u.isActive).length;
  const declinedExpiredCount = 0;

  const handleCopyLink = (u: User) => {
    const link = `${window.location.origin}/join?ref=${u.id}`;
    navigator.clipboard.writeText(link);
    setOpenDropdownId(null);
    dialog.alert('Link Copied', `Invitation link for ${u.name} copied to clipboard.`);
  };

  const handleResend = (u: User) => {
    setOpenDropdownId(null);
    dialog.alert('Invitation Resent', `Invitation email resent to ${u.email}.`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            My Invitations
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Send and manage member invitations to join Savvey Savers circles.
          </p>
        </div>

        <button
          onClick={handleOpenInviteModal}
          style={{
            backgroundColor: '#2E5A44',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 18px',
            fontWeight: 600,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          <span>Add Invitation</span>
          <ChevronDown size={14} style={{ opacity: 0.8 }} />
        </button>
      </div>

      {/* 4 KPI Progress Cards (Matches Screenshot 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Invitations */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Invitations</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {totalInvitesCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total invites issued</span>
        </div>

        {/* Card 2: Accepted */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Accepted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {acceptedInvitesCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Converted to active members</span>
        </div>

        {/* Card 3: Pending */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Pending</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {pendingInvitesCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Awaiting recipient response</span>
        </div>

        {/* Card 4: Declined / Expired */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Declined / Expired</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {declinedExpiredCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Requires re-invitation</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #ECE8E2',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by invitee, email, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                border: '1px solid #ECE8E2',
                fontSize: '0.85rem',
                backgroundColor: '#FAF9F6',
                color: '#111827',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: '10px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="">Statuses: All</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="DECLINED">Declined</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: '10px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="">Roles: All</option>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>

          {(searchQuery || statusFilter || roleFilter) && (
            <button
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#D97746',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Members & Invitations Table */}
      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Member Invitations...</span>
        </div>
      ) : (
        <div className="table-container" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', overflow: 'hidden' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
                <th style={{ width: '36px', textAlign: 'center', padding: '14px 10px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.has(u.id))}
                    ref={el => { if (el) el.indeterminate = paginatedUsers.some(u => selectedIds.has(u.id)) && !paginatedUsers.every(u => selectedIds.has(u.id)); }}
                    onChange={e => handleSelectAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2E5A44', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  INVITATION ID
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  INVITEE
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ROLE
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STATUS
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DATE SENT
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EXPIRES ON
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                    No member invitations found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const initials = u.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
                  const displayId = u.displayId || u.invitationId || u.id;
                  const dateSent = new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  const expiresOn = new Date(new Date(u.createdAt).getTime() + 14 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #ECE8E2', transition: 'background-color 0.15s ease' }}>
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(u.id)}
                          onChange={e => handleSelectRow(u.id, e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#0c4e43', cursor: 'pointer' }}
                        />
                      </td>

                      {/* Invitation ID Monospace Green Pill */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          backgroundColor: '#EAF5EE',
                          color: '#0c4e43'
                        }}>
                          {displayId}
                        </span>
                      </td>

                      {/* Invitee */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#1B4332',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                          {u.role === 'ADMIN' ? 'ADMIN' : 'CONTRIBUTING MEMBER'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: u.isActive ? '#EAF5EE' : '#FEF3C7',
                          color: u.isActive ? '#2E7D32' : '#B45309'
                        }}>
                          {u.isActive ? 'ACCEPTED' : 'PENDING'}
                        </span>
                      </td>

                      {/* Date Sent */}
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                        {dateSent}
                      </td>

                      {/* Expires On */}
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                        {expiresOn}
                      </td>

                      {/* Action dropdown */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                          style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openDropdownId === u.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '40px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '10px',
                              border: '1px solid #ECE8E2',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                              padding: '6px',
                              zIndex: 10,
                              minWidth: '180px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              textAlign: 'left'
                            }}
                          >
                            <button
                              onClick={() => handleCopyLink(u)}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#374151',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Copy size={14} />
                              <span>Copy Invite Link</span>
                            </button>

                            <button
                              onClick={() => handleResend(u)}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#374151',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Send size={14} />
                              <span>Resend Invite</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                setViewUserModal(u);
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: '#374151',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Eye size={14} />
                              <span>View Details</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedUsers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
        itemLabel="invitation"
      />

      {/* --- INVITE / ADD MEMBER MODAL --- */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsInviteModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: currentUser?.role === 'ADMIN' ? '540px' : '580px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setIsInviteModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            {currentUser?.role === 'ADMIN' ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
                  Add Member
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Create a new user profile with invitation controls.
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">First Name *</label>
                      <input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="Jane" className="form-input" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Last Name</label>
                      <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Smith" className="form-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Email Address *</label>
                      <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="jane@example.com" className="form-input" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Phone *</label>
                      <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+44 7700 900011" className="form-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Address Line 1</label>
                      <input type="text" value={formAddressLine1} onChange={(e) => setFormAddressLine1(e.target.value)} placeholder="10 Downing St" className="form-input" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Address Line 2</label>
                      <input type="text" value={formAddressLine2} onChange={(e) => setFormAddressLine2(e.target.value)} placeholder="Westminster" className="form-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">City</label>
                      <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="London" className="form-input" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Post Code</label>
                      <input type="text" value={formPostCode} onChange={(e) => setFormPostCode(e.target.value)} placeholder="SW1A 2AA" className="form-input" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        value="United Kingdom"
                        disabled
                        readOnly
                        className="form-input"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: '0 0 16px 0' }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>Select Role *</label>
                    <select value={formRole} onChange={(e) => setFormRole(e.target.value as any)} className="form-select" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="MEMBER">Savers</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>

                  {/* Permission Checklist */}
                  <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                      Permission
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPermissions.includes('SETUP_ADMIN')} onChange={(e) => handlePermissionChange('SETUP_ADMIN', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                        <span>Setup Admin</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPermissions.includes('INVITE_USER')} onChange={(e) => handlePermissionChange('INVITE_USER', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                        <span>Invite User</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPermissions.includes('ASSIGN_UNAVAILABLE_MONTH')} onChange={(e) => handlePermissionChange('ASSIGN_UNAVAILABLE_MONTH', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                        <span>Assign Unavailable month to users</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPermissions.includes('RECEIVE_UNAVAILABLE_APPROVAL')} onChange={(e) => handlePermissionChange('RECEIVE_UNAVAILABLE_APPROVAL', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                        <span>Receive Unavailable Month Approval Requests</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPermissions.includes('SUSPEND_USER')} onChange={(e) => handlePermissionChange('SUSPEND_USER', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                        <span>Suspend User</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formPermissions.includes('DELETE_USER')} onChange={(e) => handlePermissionChange('DELETE_USER', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                        <span>Delete User</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddSubmit('SAVE')}
                      disabled={formSubmitting}
                      className="btn btn-secondary"
                      style={{ flex: 1.2, backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleAddSubmit('SAVE_INVITE')}
                      disabled={formSubmitting}
                      className="btn btn-primary"
                      style={{ flex: 1.5, backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                    >
                      Save & Invite
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
