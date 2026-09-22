'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
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
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaginationControls from '../../PaginationControls';

interface Commitment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  endDate: string;
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

export default function SavingsCommitmentReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', color: '#6B7280' }}>Loading report...</div>}>
      <CommitmentsReportContent />
    </Suspense>
  );
}

function CommitmentsReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  const [harvestFilter, setHarvestFilter] = useState('');
  const [paymentConfirmedFilter, setPaymentConfirmedFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });

  const [activeModal, setActiveModal] = useState<'NONE' | 'VIEW_COMMITMENT'>('NONE');
  const [selectedCmt, setSelectedCmt] = useState<Commitment | null>(null);
  const [viewCmtPayments, setViewCmtPayments] = useState<Payment[]>([]);
  const [viewCmtLoading, setViewCmtLoading] = useState(false);

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
    fetchCommitments();
  }, [searchParams]);

  const fetchCommitments = async () => {
    try {
      const res = await fetch('/api/admin/commitments');
      if (res.ok) {
        const data = await res.json();
        setCommitments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching commitments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewModal = async (cmt: Commitment) => {
    setSelectedCmt(cmt);
    setViewCmtPayments([]);
    setViewCmtLoading(true);
    setActiveModal('VIEW_COMMITMENT');
    try {
      const res = await fetch(`/api/admin/payments?commitmentId=${cmt.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewCmtPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments for view:', err);
    } finally {
      setViewCmtLoading(false);
    }
  };

  const handleResetFilters = () => {
    setHarvestFilter('');
    setPaymentConfirmedFilter('');
    setPeriodFilter('');
    setCurrentPage(1);
  };

  const filteredCommitments = useMemo(() => commitments.filter((c) => {
    const isHarvestYes = c.harvestReleasedAt !== null && c.harvestReleasedAt !== undefined;
    if (harvestFilter === 'YES' && !isHarvestYes) return false;
    if (harvestFilter === 'NO' && isHarvestYes) return false;
    if (paymentConfirmedFilter === 'YES' && c.status !== 'COMPLETED') return false;
    if (paymentConfirmedFilter === 'NO' && c.status === 'COMPLETED') return false;
    if (periodFilter && String(c.collectionYear) !== periodFilter) return false;
    return true;
  }), [commitments, harvestFilter, paymentConfirmedFilter, periodFilter]);

  const sortedCommitments = useMemo(() => [...filteredCommitments].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];
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
  const totalHarvested = commitments.filter(c => c.harvestReleasedAt).length;
  const totalActive = commitments.filter(c => c.status === 'ACTIVE').length;
  const totalCompleted = commitments.filter(c => c.status === 'COMPLETED').length;
  const totalAmount = commitments.reduce((s, c) => s + Number(c.amount), 0);

  const handleExportCSV = () => {
    if (filteredCommitments.length === 0) return;
    const headers = ['Record ID', 'Member Name', 'Savings Amount (£)', 'Collection Month', 'Collection Year', 'Status'];
    const rows = filteredCommitments.map(c => [
      `"${c.id}"`,
      `"${c.memberName.replace(/"/g, '""')}"`,
      `"${c.amount}"`,
      `"${c.collectionMonth} ${c.collectionYear}"`,
      `"${c.collectionYear}"`,
      `"${c.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savings_commitments_report_${new Date().toISOString().split('T')[0]}.csv`;
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
        <p style={{ color: '#6B7280', fontSize: '0.88rem' }}>Loading report...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Harvest &amp; Reports
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            View savings commitments, harvest records, and payment history across all members.
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Commitments</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{commitments.length}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>All time records</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Active</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{totalActive}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Currently saving</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Harvested</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{totalHarvested}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Harvest released</span>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Pool Value</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PoundSterling size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>£{totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 0 })}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Monthly commitment sum</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
            <Filter size={15} />
            Filters:
          </div>
          <select
            value={harvestFilter}
            onChange={e => { setHarvestFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '7px 12px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#374151', fontWeight: 500, cursor: 'pointer', minWidth: '140px' }}
          >
            <option value="">Harvest Status</option>
            <option value="YES">Harvested</option>
            <option value="NO">Not Harvested</option>
          </select>

          <select
            value={paymentConfirmedFilter}
            onChange={e => { setPaymentConfirmedFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '7px 12px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#374151', fontWeight: 500, cursor: 'pointer', minWidth: '155px' }}
          >
            <option value="">Payment Status</option>
            <option value="YES">Completed</option>
            <option value="NO">Not Completed</option>
          </select>

          <select
            value={periodFilter}
            onChange={e => { setPeriodFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '7px 12px', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#374151', fontWeight: 500, cursor: 'pointer', minWidth: '130px' }}
          >
            <option value="">Year</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>

          {(harvestFilter || paymentConfirmedFilter || periodFilter) && (
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

      {/* Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th onClick={() => requestSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Record ID {sortIcon('id')}</div>
                </th>
                <th onClick={() => requestSort('memberName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Member Name {sortIcon('memberName')}</div>
                </th>
                <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Savings Amount {sortIcon('amount')}</div>
                </th>
                <th onClick={() => requestSort('goal')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Goal {sortIcon('goal')}</div>
                </th>
                <th onClick={() => requestSort('collectionMonth')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Collection Period {sortIcon('collectionMonth')}</div>
                </th>
                <th onClick={() => requestSort('harvestAmount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Harvest Amount {sortIcon('harvestAmount')}</div>
                </th>
                <th onClick={() => requestSort('harvestReleasedAt')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Harvest Date {sortIcon('harvestReleasedAt')}</div>
                </th>
                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Status {sortIcon('status')}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentCommitments.map((cmt) => (
                <tr key={cmt.id}>
                  <td>
                    <button
                      onClick={() => handleOpenViewModal(cmt)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: '#2E5A44', fontFamily: 'monospace', fontSize: '0.82rem', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                      {cmt.id}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{cmt.memberName}</td>
                  <td style={{ fontWeight: 700, color: '#16a34a' }}>£{Number(cmt.amount).toFixed(2)}</td>
                  <td style={{ color: '#374151', fontSize: '0.85rem' }}>{cmt.goal || 'Savings Goal'}</td>
                  <td style={{ color: '#374151' }}>{cmt.collectionMonth} {cmt.collectionYear}</td>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>
                    {cmt.harvestAmount !== null && cmt.harvestAmount !== undefined ? `£${Number(cmt.harvestAmount).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                    {cmt.harvestReleasedAt ? new Date(cmt.harvestReleasedAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td>
                    <span className={`status-pill ${cmt.status.toLowerCase().replace(/_/g, '-')}`}>
                      {cmt.status === 'NOT_YET_STARTED' ? 'Not Yet Started' : cmt.status.charAt(0).toUpperCase() + cmt.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {currentCommitments.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                    No savings commitments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedCommitments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
        itemLabel="commitment"
      />

      {/* View Commitment Details Modal */}
      {activeModal === 'VIEW_COMMITMENT' && selectedCmt && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <PoundSterling size={20} style={{ color: '#2E5A44' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', margin: 0 }}>Saving Commitment</h3>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#2E5A44', paddingLeft: '30px' }}>{selectedCmt.id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#FAF9F6', borderRadius: '12px', padding: '16px', border: '1px solid #ECE8E2' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Record ID</span>
                <div style={{ fontWeight: 700, color: '#111827', fontFamily: 'monospace', marginTop: '4px', fontSize: '0.85rem' }}>{selectedCmt.id}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Name</span>
                <div style={{ marginTop: '4px' }}>
                  <button
                    onClick={() => { router.push(`/dashboard/users?search=${encodeURIComponent(selectedCmt.memberName)}`); setActiveModal('NONE'); }}
                    style={{ background: 'none', border: 'none', color: '#2E5A44', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Go to Manage Users"
                  >
                    {selectedCmt.memberName}
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collection Period</span>
                <div style={{ fontWeight: 600, color: '#111827', marginTop: '4px' }}>{selectedCmt.collectionMonth} {selectedCmt.collectionYear}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Amount</span>
                <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '4px', fontSize: '1rem' }}>£{Number(selectedCmt.amount).toFixed(2)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`status-pill ${selectedCmt.status.toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.72rem' }}>
                    {selectedCmt.status === 'NOT_YET_STARTED' ? 'Not Yet Started' : selectedCmt.status.charAt(0).toUpperCase() + selectedCmt.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              {selectedCmt.harvestAmount != null && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Harvest Amount</span>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>£{Number(selectedCmt.harvestAmount).toFixed(2)}</div>
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</h4>
            {viewCmtLoading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>Loading payments...</div>
            ) : viewCmtPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '0.85rem', backgroundColor: '#FAF9F6', borderRadius: '8px', border: '1px solid #ECE8E2' }}>
                No payments logged yet for this commitment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #ECE8E2' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '2px solid #ECE8E2' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6B7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCmtPayments.map((pay, i) => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid #ECE8E2', backgroundColor: i % 2 === 0 ? 'transparent' : '#FAF9F6' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#6B7280' }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{pay.month}</td>
                        <td style={{ padding: '10px 14px' }}>{pay.year}</td>
                        <td style={{ padding: '10px 14px', color: '#6B7280' }}>
                          {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#16a34a' }}>£{Number(pay.amount).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`status-pill ${pay.status === 'CONFIRMED' ? 'active' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                            {pay.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setActiveModal('NONE')}
                style={{ backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #ECE8E2', borderRadius: '8px', padding: '8px 22px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
