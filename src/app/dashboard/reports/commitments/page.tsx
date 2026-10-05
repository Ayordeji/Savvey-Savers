'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Download,
  ExternalLink,
  X,
  PoundSterling,
  RotateCcw,
  ChevronDown,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Filter,
  ArrowRight,
  Receipt,
  Mail,
  MoreVertical,
  Copy,
  Gift,
  Check,
  Calendar
} from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../../PaginationControls';

interface Commitment {
  id: string;
  displayId?: string;
  memberId: string;
  memberName: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  endDate?: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NOT_YET_STARTED';
  payments?: Payment[];
  harvestAmount?: number | null;
  harvestReleasedAt?: string | null;
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
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  displayId?: string;
  invitationId?: string;
}

export default function SavingsCommitmentReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: '#6B7280' }}>Loading harvest report...</div>}>
      <CommitmentsReportContent />
    </Suspense>
  );
}

function CommitmentsReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useDialog();

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [harvestFilter, setHarvestFilter] = useState('');
  const [paymentConfirmedFilter, setPaymentConfirmedFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  // Dropdown states
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Drawer states
  const [selectedCmt, setSelectedCmt] = useState<Commitment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [viewCmtPayments, setViewCmtPayments] = useState<Payment[]>([]);
  const [viewCmtLoading, setViewCmtLoading] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const h = searchParams.get('harvest');
    if (h) setHarvestFilter(h);
    const id = searchParams.get('id');
    if (id) setSearchQuery(id);
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cmtRes, usrRes] = await Promise.all([
        fetch('/api/admin/commitments'),
        fetch('/api/admin/users')
      ]);

      if (cmtRes.ok) {
        const data = await cmtRes.json();
        setCommitments(Array.isArray(data) ? data : []);
      }
      if (usrRes.ok) {
        const uList = await usrRes.json();
        setUsers(Array.isArray(uList) ? uList.filter((u: any) => u.role === 'MEMBER') : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // User Map for fast lookup
  const usrMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => {
      map.set(u.id, u);
      if (u.name) map.set(u.name.toLowerCase(), u);
    });
    return map;
  }, [users]);

  // Helper for member & harvest details
  const getCommitmentDetails = (cmt: Commitment) => {
    const memberUser = usrMap.get(cmt.memberId) || usrMap.get(cmt.memberName.toLowerCase());
    const memberEmail = memberUser?.email || '';
    const memberDisplayId = memberUser?.displayId || memberUser?.invitationId || '';
    const initials = cmt.memberName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';

    const rawId = cmt.displayId || cmt.id;
    let displayId = rawId;
    if (typeof rawId === 'string' && rawId.length > 14) {
      if (rawId.startsWith('CMT-')) {
        const rest = rawId.substring(4);
        displayId = `CMT-${rest.slice(0, 4)}...${rest.slice(-4)}`;
      } else {
        const clean = rawId.replace(/[^a-zA-Z0-9]/g, '');
        displayId = `CMT-${clean.slice(0, 4).toUpperCase()}...${clean.slice(-4).toUpperCase()}`;
      }
    }

    const isHarvested = Boolean(cmt.harvestReleasedAt || (cmt.harvestAmount && Number(cmt.harvestAmount) > 0));
    const expectedHarvest = cmt.harvestAmount && Number(cmt.harvestAmount) > 0
      ? Number(cmt.harvestAmount)
      : Number(cmt.amount) * 12;

    return {
      memberEmail,
      memberDisplayId,
      initials,
      displayId,
      rawId,
      isHarvested,
      expectedHarvest
    };
  };

  // Row selection to open slide drawer
  const handleRowClick = async (cmt: Commitment) => {
    setSelectedCmt(cmt);
    setDrawerOpen(true);
    setViewCmtPayments([]);
    setViewCmtLoading(true);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }

    try {
      const res = await fetch(`/api/admin/payments?commitmentId=${cmt.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewCmtPayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching payments for view:', err);
    } finally {
      setViewCmtLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setHarvestFilter('');
    setPaymentConfirmedFilter('');
    setPeriodFilter('');
    setCurrentPage(1);
  };

  const filteredCommitments = useMemo(() => commitments.filter((c) => {
    const d = getCommitmentDetails(c);

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        c.id.toLowerCase().includes(q) ||
        (d.rawId && d.rawId.toLowerCase().includes(q)) ||
        d.displayId.toLowerCase().includes(q) ||
        c.memberName.toLowerCase().includes(q) ||
        (d.memberEmail && d.memberEmail.toLowerCase().includes(q)) ||
        (c.goal && c.goal.toLowerCase().includes(q)) ||
        (c.collectionMonth && c.collectionMonth.toLowerCase().includes(q)) ||
        String(c.collectionYear).includes(q);
      if (!match) return false;
    }

    // Harvest filter
    if (harvestFilter === 'YES' && !d.isHarvested) return false;
    if (harvestFilter === 'NO' && d.isHarvested) return false;

    // Status filter
    if (paymentConfirmedFilter && c.status !== paymentConfirmedFilter) return false;

    // Period filter (year)
    if (periodFilter && String(c.collectionYear) !== periodFilter) return false;

    return true;
  }), [commitments, searchQuery, harvestFilter, paymentConfirmedFilter, periodFilter, usrMap]);

  const sortedCommitments = useMemo(() => [...filteredCommitments].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'harvestAmount') {
      aVal = Number(a.harvestAmount || a.amount * 12);
      bVal = Number(b.harvestAmount || b.amount * 12);
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
        : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  }), [filteredCommitments, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedCommitments.length / itemsPerPage));
  const currentCommitments = sortedCommitments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // KPI summaries
  const completedHarvests = commitments.filter(c => c.harvestReleasedAt !== null || (c.harvestAmount && Number(c.harvestAmount) > 0));
  const totalHarvested = completedHarvests.length;
  const totalHarvestReleasedAmount = completedHarvests.reduce((sum, c) => sum + (Number(c.harvestAmount) || (Number(c.amount) * 12)), 0);

  const pendingHarvests = commitments.filter(c => !c.harvestReleasedAt && (!c.harvestAmount || Number(c.harvestAmount) === 0) && c.status !== 'CANCELLED');
  const totalPendingHarvestsCount = pendingHarvests.length;
  const totalPendingHarvestAmount = pendingHarvests.reduce((sum, c) => sum + (Number(c.amount) * 12), 0);

  const totalPoolValue = commitments.reduce((sum, c) => sum + (Number(c.amount) * 12), 0);

  const handleExportCSV = () => {
    if (filteredCommitments.length === 0) return;
    const headers = ['Commitment ID', 'Member Name', 'Member Email', 'Goal', 'Monthly Amount (£)', 'Harvest Period', 'Harvest Amount (£)', 'Harvest Status'];
    const rows = filteredCommitments.map(c => {
      const d = getCommitmentDetails(c);
      return [
        `"${d.displayId}"`,
        `"${c.memberName.replace(/"/g, '""')}"`,
        `"${d.memberEmail}"`,
        `"${(c.goal || 'Savings Goal').replace(/"/g, '""')}"`,
        `"${Number(c.amount).toFixed(2)}"`,
        `"${c.collectionMonth} ${c.collectionYear}"`,
        `"${d.expectedHarvest.toFixed(2)}"`,
        `"${d.isHarvested ? 'Harvest Released' : 'Pending Harvest'}"`
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harvests_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>⇕</span>;
    return <span style={{ fontSize: '0.7rem', color: '#2E5A44' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #ECE8E2', borderTopColor: '#2E5A44', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: '0.88rem' }}>Loading harvest records...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Harvests &amp; Reports
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Track member savings milestones, harvest payout releases, and contribution records across cycles.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
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
          <span>Export CSV</span>
          <ChevronDown size={14} style={{ opacity: 0.7 }} />
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Commitments</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{commitments.length}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Active &amp; completed cycles</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Harvests Released</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2E7D32', lineHeight: 1 }}>
            £{totalHarvestReleasedAmount.toLocaleString('en-GB', { minimumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {totalHarvested} harvest{totalHarvested === 1 ? '' : 's'} paid out
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Pending Harvests</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>
            £{totalPendingHarvestAmount.toLocaleString('en-GB', { minimumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {totalPendingHarvestsCount} upcoming collection{totalPendingHarvestsCount === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Pool Value</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PoundSterling size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            £{totalPoolValue.toLocaleString('en-GB', { minimumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total rotating commitment sum</span>
        </div>
      </div>

      {/* Filter Bar matching other dashboard pages */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search input with icon */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search member, ID, goal..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: '1px solid #ECE8E2',
                backgroundColor: '#FAF9F6',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={harvestFilter}
            onChange={e => { setHarvestFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#374151', fontWeight: 500, cursor: 'pointer', minWidth: '145px' }}
          >
            <option value="">All Harvests</option>
            <option value="YES">Harvest Released</option>
            <option value="NO">Pending Harvest</option>
          </select>

          <select
            value={paymentConfirmedFilter}
            onChange={e => { setPaymentConfirmedFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#374151', fontWeight: 500, cursor: 'pointer', minWidth: '145px' }}
          >
            <option value="">Cycle Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={periodFilter}
            onChange={e => { setPeriodFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#374151', fontWeight: 500, cursor: 'pointer', minWidth: '110px' }}
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>

          {(searchQuery || harvestFilter || paymentConfirmedFilter || periodFilter) && (
            <button
              onClick={handleResetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', fontSize: '0.8rem', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>

        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
          {filteredCommitments.length} record{filteredCommitments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main Two-Column Layout (Table on Left, Drawer Box on Right) */}
      <div className="dashboard-table-drawer-container" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Side: Table */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <div className="table-container" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', overflow: 'hidden' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
                  <th
                    onClick={() => requestSort('id')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '130px', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>COMMITMENT ID {sortIcon('id')}</div>
                  </th>
                  <th
                    onClick={() => requestSort('memberName')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>MEMBER {sortIcon('memberName')}</div>
                  </th>
                  <th
                    onClick={() => requestSort('goal')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>SAVINGS GOAL {sortIcon('goal')}</div>
                  </th>
                  <th
                    onClick={() => requestSort('amount')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>MONTHLY OBLIGATION {sortIcon('amount')}</div>
                  </th>
                  <th
                    onClick={() => requestSort('collectionMonth')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>HARVEST PERIOD {sortIcon('collectionMonth')}</div>
                  </th>
                  <th
                    onClick={() => requestSort('harvestAmount')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>HARVEST AMOUNT {sortIcon('harvestAmount')}</div>
                  </th>
                  <th
                    onClick={() => requestSort('status')}
                    style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>STATUS {sortIcon('status')}</div>
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentCommitments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                      No harvest or commitment records match your filters.
                    </td>
                  </tr>
                ) : (
                  currentCommitments.map((cmt) => {
                    const d = getCommitmentDetails(cmt);
                    const isRowSelected = selectedCmt?.id === cmt.id && drawerOpen;

                    return (
                      <tr
                        key={cmt.id}
                        onClick={() => handleRowClick(cmt)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #ECE8E2',
                          transition: 'background-color 0.15s ease',
                          backgroundColor: isRowSelected ? '#FAF9F6' : undefined
                        }}
                      >
                        {/* ID Monospace badge */}
                        <td style={{ padding: '14px 16px', width: '130px', whiteSpace: 'nowrap' }}>
                          <span
                            title={`Commitment ID: ${d.rawId} (Click to copy)`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(d.rawId);
                              dialog.alert('Copied', `Commitment ID ${d.rawId} copied to clipboard.`);
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              backgroundColor: '#EAF5EE',
                              color: '#0c4e43',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
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
                                {cmt.memberName} {d.memberDisplayId ? <span style={{ fontSize: '0.72rem', color: '#57655c', fontFamily: 'monospace' }}>({d.memberDisplayId})</span> : null}
                              </div>
                              {d.memberEmail ? (
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                  {d.memberEmail}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Goal */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#374151' }}>
                          {cmt.goal || 'Savings Goal'}
                        </td>

                        {/* Monthly Obligation */}
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                          £{Number(cmt.amount).toFixed(2)}/mo
                        </td>

                        {/* Harvest Period */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#374151' }}>
                          {cmt.collectionMonth} {cmt.collectionYear}
                        </td>

                        {/* Harvest Amount */}
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1B4332', fontSize: '0.92rem' }}>
                          £{d.expectedHarvest.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: d.isHarvested ? '#EAF5EE' : '#FEF3C7',
                            color: d.isHarvested ? '#2E7D32' : '#B45309'
                          }}>
                            {d.isHarvested ? 'Harvest Released' : 'Pending Harvest'}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === cmt.id ? null : cmt.id)}
                            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openDropdownId === cmt.id && (
                            <div style={{
                              position: 'absolute',
                              right: '16px',
                              top: '40px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '10px',
                              border: '1px solid #ECE8E2',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                              padding: '6px',
                              zIndex: 10,
                              minWidth: '185px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              textAlign: 'left'
                            }}>
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  handleRowClick(cmt);
                                }}
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
                                <Gift size={14} />
                                <span>View Harvest Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  router.push(`/dashboard/commitments?id=${encodeURIComponent(cmt.id)}`);
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
                                <span>Go to Commitment</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  router.push(`/dashboard/users?search=${encodeURIComponent(cmt.memberName)}`);
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
                                <ExternalLink size={14} />
                                <span>View Member Profile</span>
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

          {/* Pagination */}
          <div style={{ marginTop: '16px' }}>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedCommitments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
              itemLabel="harvest record"
            />
          </div>
        </div>

        {/* Right Side: Slide Drawer Box (Matches Members, Commitments, Payments) */}
        {drawerOpen && selectedCmt && (
          <div
            ref={drawerRef}
            id="harvest-details-drawer"
            className="dashboard-drawer"
            style={{
              width: '420px',
              maxWidth: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #ECE8E2',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'sticky',
              top: '80px',
              flexShrink: 0
            }}
          >
            {(() => {
              const d = getCommitmentDetails(selectedCmt);

              return (
                <>
                  {/* Drawer Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                      Harvest Details
                    </h3>
                    <button
                      onClick={() => { setDrawerOpen(false); setSelectedCmt(null); }}
                      aria-label="Close details"
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Member Summary Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#0c4e43',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.15rem',
                      flexShrink: 0
                    }}>
                      {d.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                          {selectedCmt.memberName}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: d.isHarvested ? '#EAF5EE' : '#FEF3C7',
                          color: d.isHarvested ? '#2E7D32' : '#B45309'
                        }}>
                          {d.isHarvested ? 'Harvest Released' : 'Pending Harvest'}
                        </span>
                      </div>
                      {d.memberDisplayId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0c4e43', fontWeight: 700, backgroundColor: '#EAF5EE', padding: '1px 6px', borderRadius: '4px' }}>
                            {d.memberDisplayId}
                          </span>
                        </div>
                      )}
                      {d.memberEmail && (
                        <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.memberEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Harvest Payout Card with Direct Action */}
                  <div style={{
                    backgroundColor: '#F8FAF8',
                    border: '1.5px solid #D5E5DB',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0c4e43' }}>
                          HARVEST PAYOUT
                        </div>
                        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', marginTop: '4px', lineHeight: 1.1 }}>
                          £{d.expectedHarvest.toFixed(2)}
                        </div>
                      </div>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: d.isHarvested ? '#EAF5EE' : '#FEF3C7',
                        color: d.isHarvested ? '#2E7D32' : '#B45309'
                      }}>
                        {d.isHarvested ? <CheckCircle size={13} /> : <Clock size={13} />}
                        <span>{d.isHarvested ? 'Paid Out' : 'Scheduled'}</span>
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.4 }}>
                      {d.isHarvested
                        ? `Harvest payout released on ${selectedCmt.harvestReleasedAt ? new Date(selectedCmt.harvestReleasedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'record'}.`
                        : `Scheduled for disbursement in ${selectedCmt.collectionMonth} ${selectedCmt.collectionYear}.`
                      }
                    </div>

                    <button
                      onClick={() => {
                        router.push(`/dashboard/commitments?id=${encodeURIComponent(selectedCmt.id)}`);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#1B4332',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '11px 16px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'background-color 0.15s ease',
                        boxShadow: '0 2px 8px rgba(27, 67, 50, 0.2)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0c4e43'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B4332'}
                    >
                      <Receipt size={16} />
                      <span>Go to Savings Commitment</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>

                  {/* Cycle Information Breakdown */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #ECE8E2',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Cycle Specifications
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6B7280' }}>Commitment ID:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827', fontSize: '0.8rem' }}>
                            {d.displayId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(d.rawId);
                              dialog.alert('Copied', `Commitment ID ${d.rawId} copied to clipboard.`);
                            }}
                            title="Copy reference"
                            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '2px', display: 'flex' }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6B7280' }}>Savings Goal:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {selectedCmt.goal || 'Savings Goal'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6B7280' }}>Monthly Obligation:</span>
                        <span style={{ fontWeight: 700, color: '#111827' }}>
                          £{Number(selectedCmt.amount).toFixed(2)}/mo
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6B7280' }}>Cycle Harvest Month:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {selectedCmt.collectionMonth} {selectedCmt.collectionYear}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6B7280' }}>Cycle Status:</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {selectedCmt.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Log */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #ECE8E2',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Contribution Payments
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0c4e43', backgroundColor: '#EAF5EE', padding: '2px 8px', borderRadius: '9999px' }}>
                        {viewCmtPayments.filter(p => p.status === 'CONFIRMED').length} / 12 Paid
                      </span>
                    </div>

                    {viewCmtLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '0.82rem' }}>
                        Loading payment history...
                      </div>
                    ) : viewCmtPayments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: '#9CA3AF', fontSize: '0.8rem', backgroundColor: '#FAF9F6', borderRadius: '10px' }}>
                        No contributions logged yet for this cycle.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                        {viewCmtPayments.map((p, idx) => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#FAF9F6',
                              border: '1px solid #ECE8E2',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: '#6B7280', width: '16px' }}>{idx + 1}.</span>
                              <span style={{ fontWeight: 600, color: '#111827' }}>{p.month} {p.year}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: '#111827' }}>£{Number(p.amount).toFixed(2)}</span>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '9999px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                backgroundColor: p.status === 'CONFIRMED' ? '#EAF5EE' : '#FEF3C7',
                                color: p.status === 'CONFIRMED' ? '#2E7D32' : '#B45309'
                              }}>
                                {p.status === 'CONFIRMED' ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => {
                        router.push(`/dashboard/users?search=${encodeURIComponent(selectedCmt.memberName)}`);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#FAF9F6',
                        color: '#374151',
                        border: '1px solid #ECE8E2',
                        borderRadius: '10px',
                        padding: '9px 14px',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>View Member Profile</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
