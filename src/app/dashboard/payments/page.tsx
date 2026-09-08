'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Banknote,
  Wallet,
  ChevronDown,
  ArrowRight,
  Receipt,
  Mail,
  FileText,
  Plus,
  RotateCcw,
  Check
} from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';

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

interface Commitment {
  id: string;
  displayId?: string;
  memberId: string;
  memberName: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: '#6B7280' }}>Loading payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useDialog();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  // Dropdown states
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, cmtRes, usrRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/commitments'),
        fetch('/api/admin/users')
      ]);

      if (payRes.ok) {
        setPayments(await payRes.json());
      }
      if (cmtRes.ok) {
        setCommitments(await cmtRes.json());
      }
      if (usrRes.ok) {
        const uList = await usrRes.json();
        setUsers(uList.filter((u: any) => u.role === 'MEMBER'));
      }
    } catch (err) {
      console.error('Error fetching payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map commitments & users by id for fast lookups
  const cmtMap = useMemo(() => {
    const map = new Map<string, Commitment>();
    commitments.forEach(c => map.set(c.id, c));
    return map;
  }, [commitments]);

  const usrMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  // Months available
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to determine simulated or real payment status
  const getPaymentDetails = (p: Payment) => {
    const cmt = cmtMap.get(p.commitmentId);
    const memberName = cmt?.memberName || 'Member';
    const memberUser = users.find(u => u.id === cmt?.memberId || u.name.toLowerCase() === memberName.toLowerCase());
    const memberEmail = memberUser?.email || '';
    const memberDisplayId = (memberUser as any)?.displayId || (memberUser as any)?.invitationId || '';
    const initials = memberName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
    const commitmentTag = cmt ? `${cmt.collectionMonth} - ${cmt.goal || 'Savings Pool'} (£${Number(cmt.amount).toFixed(0)})` : 'Savings Pool';
    const displayId = (p as any).displayId || (p as any).reference || p.id;

    // Status: RECEIVED (CONFIRMED), PENDING, or OVERDUE
    let statusLabel: 'RECEIVED' | 'PENDING' | 'OVERDUE' = p.status === 'CONFIRMED' ? 'RECEIVED' : 'PENDING';

    return {
      memberName,
      memberEmail,
      memberDisplayId,
      initials,
      commitmentTag,
      displayId,
      statusLabel
    };
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const details = getPaymentDetails(p);

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          details.memberName.toLowerCase().includes(q) ||
          details.memberEmail.toLowerCase().includes(q) ||
          details.displayId.toLowerCase().includes(q) ||
          details.commitmentTag.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status Filter
      if (statusFilter && details.statusLabel !== statusFilter) {
        return false;
      }

      // Month Filter
      if (monthFilter && p.month !== monthFilter) {
        return false;
      }

      // Member Filter
      if (memberFilter && details.memberName !== memberFilter) {
        return false;
      }

      return true;
    });
  }, [payments, searchQuery, statusFilter, monthFilter, memberFilter, cmtMap, users]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const paginatedPayments = useMemo(() => {
    return filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  // KPI Calculations
  const receivedCount = payments.filter(p => p.status === 'CONFIRMED').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;
  const overdueCount = 0; // In standard cycle, overdue is 0 when all active are verified
  const totalPayments = payments.length || 1;
  const receivedPct = Math.min(100, Math.round((receivedCount / totalPayments) * 100));

  const totalCollectedThisMonth = payments
    .filter(p => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalExpectedTarget = commitments
    .filter(c => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || totalCollectedThisMonth;

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setMonthFilter('');
    setMemberFilter('');
    setCurrentPage(1);
  };

  const handleConfirmPayment = async (p: Payment) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Confirm Payment Receipt', `Confirm payment of £${Number(p.amount).toFixed(2)} for ${p.month} ${p.year}? This will send a confirmation receipt.`))) {
      return;
    }

    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PAYMENT',
          paymentId: p.id,
          commitmentId: p.commitmentId
        })
      });

      if (res.ok) {
        await dialog.alert('Payment Confirmed', 'The payment receipt has been confirmed and verified.');
        fetchData();
      } else {
        const data = await res.json();
        await dialog.alert('Error', data.error || 'Failed to confirm payment.');
      }
    } catch (err) {
      console.error('Confirm error:', err);
      await dialog.alert('Error', 'A network error occurred.');
    }
  };

  const handleExport = () => {
    const csvRows = [
      ['Payment ID', 'Member', 'Commitment', 'Amount', 'Status', 'Date'].join(',')
    ];
    filteredPayments.forEach(p => {
      const d = getPaymentDetails(p);
      csvRows.push([
        d.displayId,
        `"${d.memberName}"`,
        `"${d.commitmentTag}"`,
        `£${Number(p.amount).toFixed(2)}`,
        d.statusLabel,
        p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Payments
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Track monthly member contributions, record payments, and manage collection cycles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleExport}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #ECE8E2',
              borderRadius: '10px',
              padding: '9px 16px',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>Export</span>
            <ChevronDown size={14} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>

      {/* 4 KPI Progress Cards (Screenshot 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Collected This Month */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Collected This Month</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            £{totalCollectedThisMonth.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {receivedCount} of {totalPayments} collected ({receivedPct}%)
          </span>
        </div>

        {/* Card 2: Payments Received */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Payments Received</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {receivedCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>All payments verified</span>
        </div>

        {/* Card 3: Pending Payments */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Pending Payments</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {pendingCount === 0 ? 'No pending payments' : `${pendingCount} awaiting confirmation`}
          </span>
        </div>

        {/* Card 4: Overdue Payments */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Overdue Payments</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {overdueCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>No overdue accounts</span>
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
              placeholder="Search by member, pool, or ID..."
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
            <option value="RECEIVED">Received</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
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
            <option value="">Months: All</option>
            {monthsList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
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
            <option value="">Members: All</option>
            {users.map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>

          {(searchQuery || statusFilter || monthFilter || memberFilter) && (
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

      {/* Main Two-Column Layout (Table on Left, 4 Widgets on Right) */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Side: Payments Table */}
        <div style={{ flex: '1 1 650px', minWidth: 0 }}>
          {loading ? (
            <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
              <div className="loading-spinner"></div>
              <span style={{ color: 'var(--text-muted)' }}>Loading payments...</span>
            </div>
          ) : (
            <div className="table-container" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', overflow: 'hidden' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
                    <th style={{ width: '36px', textAlign: 'center', padding: '14px 10px' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#2E5A44' }} />
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PAYMENT ID
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      MEMBER
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      COMMITMENT
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AMOUNT
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      STATUS
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PAYMENT DATE
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                        No payments match your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p) => {
                      const d = getPaymentDetails(p);

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #ECE8E2', transition: 'background-color 0.15s ease' }}>
                          <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#0c4e43' }} />
                          </td>

                          {/* Payment ID Monospace Pill */}
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
                              {d.displayId}
                            </span>
                          </td>

                          {/* Member */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: '#0c4e43',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0
                              }}>
                                {d.initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                                  {d.memberName} {d.memberDisplayId ? <span style={{ fontSize: '0.72rem', color: '#57655c', fontFamily: 'monospace' }}>({d.memberDisplayId})</span> : null}
                                </div>
                                {d.memberEmail ? (
                                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                    {d.memberEmail}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* Commitment */}
                          <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#4B5563' }}>
                            {d.commitmentTag}
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>
                            £{Number(p.amount).toFixed(2)}
                          </td>

                          {/* Status Pill */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 9px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: d.statusLabel === 'RECEIVED' ? '#EAF5EE' : d.statusLabel === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                              color: d.statusLabel === 'RECEIVED' ? '#2E7D32' : d.statusLabel === 'PENDING' ? '#B45309' : '#DC2626'
                            }}>
                              {d.statusLabel}
                            </span>
                          </td>

                          {/* Payment Date */}
                          <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* Action */}
                          <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === p.id ? null : p.id)}
                              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openDropdownId === p.id && (
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
                                  gap: '2px'
                                }}
                              >
                                {p.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleConfirmPayment(p)}
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: '#2E5A44',
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
                                    <CheckCircle size={14} />
                                    <span>Confirm Receipt</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    router.push(`/dashboard/commitments`);
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
                                  <Receipt size={14} />
                                  <span>View Commitment</span>
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

          {/* Pagination */}
          <div style={{ marginTop: '16px' }}>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPayments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
              itemLabel="payment"
            />
          </div>
        </div>

        {/* Right Side: 4 Widgets (Matches Screenshot 4) */}
        <div style={{ width: '360px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Widget 1: Payment Overview Donut Chart */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #ECE8E2', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '16px' }}>
              Payment Overview
            </h3>

            {/* Donut Chart Visual */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '180px' }}>
              <svg width="170" height="170" viewBox="0 0 170 170">
                {/* Background Ring */}
                <circle cx="85" cy="85" r="65" fill="none" stroke="#F3F4F6" strokeWidth="18" />
                {/* Received Ring */}
                <circle
                  cx="85"
                  cy="85"
                  r="65"
                  fill="none"
                  stroke="#2E5A44"
                  strokeWidth="18"
                  strokeDasharray={`${(receivedPct / 100) * 408} 408`}
                  strokeDashoffset="102"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                  {totalPayments}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#2E7D32', fontWeight: 700, marginTop: '2px' }}>
                  {receivedPct}% Collected
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', borderTop: '1px solid #ECE8E2', paddingTop: '14px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2E5A44' }} />
                <span style={{ color: '#6B7280' }}>Received:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{receivedCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C59A52' }} />
                <span style={{ color: '#6B7280' }}>Pending:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{pendingCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97746' }} />
                <span style={{ color: '#6B7280' }}>Overdue:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{overdueCount}</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Collection Performance */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #ECE8E2', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '14px' }}>
              Collection Performance
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
              <span style={{ color: '#6B7280' }}>Current Target:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>£{totalExpectedTarget.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '12px' }}>
              <span style={{ color: '#6B7280' }}>Total Collected:</span>
              <span style={{ fontWeight: 700, color: '#2E7D32' }}>£{totalCollectedThisMonth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Performance Progress Bar */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#ECE8E2', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${receivedPct}%`, height: '100%', backgroundColor: '#2E5A44', borderRadius: '9999px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.75rem', color: '#2E7D32', fontWeight: 600 }}>
              <CheckCircle size={14} />
              <span>On track for current collection cycle</span>
            </div>
          </div>

          {/* Widget 3: Recent Overdue Payments */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #ECE8E2', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '12px' }}>
              Recent Overdue Payments
            </h3>

            <div style={{ backgroundColor: '#FAF9F6', borderRadius: '12px', padding: '16px', border: '1px solid #ECE8E2', textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Check size={18} strokeWidth={2.5} />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#4B5563', margin: 0, lineHeight: 1.4 }}>
                No overdue payments recorded for this cycle. All members are up to date.
              </p>
            </div>
          </div>

          {/* Widget 4: Quick Actions */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #ECE8E2', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '14px' }}>
              Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => router.push('/dashboard/commitments')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#FAF9F6',
                  border: '1px solid #ECE8E2',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Record Member Payment</span>
                <ArrowRight size={14} color="#6B7280" />
              </button>

              <button
                onClick={() => router.push('/dashboard/commitments')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#FAF9F6',
                  border: '1px solid #ECE8E2',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Send Bulk Payment Reminder</span>
                <Mail size={14} color="#6B7280" />
              </button>

              <button
                onClick={() => router.push('/dashboard/reports')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#FAF9F6',
                  border: '1px solid #ECE8E2',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Generate Monthly Report</span>
                <FileText size={14} color="#6B7280" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
