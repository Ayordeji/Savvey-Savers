'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Search, Download, ExternalLink, X, PoundSterling, Filter, RotateCcw } from 'lucide-react';
import styles from '../../commitments/commitments.module.css';
import { useRouter } from 'next/navigation';
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
    <Suspense fallback={<div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading report...</div>}>
      <CommitmentsReportContent />
    </Suspense>
  );
}

function CommitmentsReportContent() {
  const router = useRouter();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  // Pagination
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

  // View Modal
  const [activeModal, setActiveModal] = useState<'NONE' | 'VIEW_COMMITMENT'>('NONE');
  const [selectedCmt, setSelectedCmt] = useState<Commitment | null>(null);
  const [viewCmtPayments, setViewCmtPayments] = useState<Payment[]>([]);
  const [viewCmtLoading, setViewCmtLoading] = useState(false);

  useEffect(() => {
    fetchCommitments();
  }, []);

  const fetchCommitments = async () => {
    try {
      const res = await fetch('/api/admin/commitments');
      if (res.ok) {
        const data = await res.json();
        // ensure it's an array
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
    setStatusFilter('');
    setPeriodFilter('');
    setCurrentPage(1);
  };

  // Filter Logic
  // (Assuming PaymentConfirmedFilter requires querying payments if strictly applied, but to keep it simple, we filter based on standard status properties first)
  const filteredCommitments = commitments.filter((c) => {
    // Determine harvest status (Yes = COMPLETED)
    const isHarvestYes = c.status === 'COMPLETED';
    
    // Determine payment status (Yes = has CONFIRMED payment)
    const isPaymentYes = c.payments && c.payments.some((p: any) => p.status === 'CONFIRMED');

    if (statusFilter === 'YES_HARVEST_YES_PAYMENT' && (!isHarvestYes || !isPaymentYes)) return false;
    if (statusFilter === 'YES_HARVEST_NO_PAYMENT' && (!isHarvestYes || isPaymentYes)) return false;
    if (statusFilter === 'NO_HARVEST_YES_PAYMENT' && (isHarvestYes || !isPaymentYes)) return false;
    if (statusFilter === 'NO_HARVEST_NO_PAYMENT' && (isHarvestYes || isPaymentYes)) return false;
    
    if (periodFilter && String(c.collectionYear) !== periodFilter) return false;
    
    return true;
  });

  const sortedCommitments = [...filteredCommitments].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'id') {
      aVal = a.id || '';
      bVal = b.id || '';
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
        : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedCommitments.length / itemsPerPage));
  const currentCommitments = sortedCommitments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    if (filteredCommitments.length === 0) return;
    const headers = ['Record ID', 'Member Name', 'Savings Amount (£)', 'Collection Month', 'Collection Year', 'Status'];
    const rows = filteredCommitments.map(c => [
      `"${c.id}"`,
      `"${c.memberName.replace(/"/g, '""')}"`,
      `"${c.amount}"`,
      `"${c.goal}"`,
      `"${c.collectionMonth} ${c.collectionYear}"`,
      `"${c.endDate}"`,
      `"${c.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `savings_commitments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
        <div className={styles.spinner} style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading report...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.filterContainer}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Savings Commitments Report
          </h2>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className={styles.controlsBar} style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-select" style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', minWidth: '150px' }}>
            <option value="">Harvest & Payment Status</option>
            <option value="YES_HARVEST_YES_PAYMENT">Yes Harvest Yes Payment</option>
            <option value="YES_HARVEST_NO_PAYMENT">Yes Harvest No Payment</option>
            <option value="NO_HARVEST_YES_PAYMENT">No Harvest Yes Payment</option>
            <option value="NO_HARVEST_NO_PAYMENT">No Harvest No Payment</option>
          </select>

          <select value={periodFilter} onChange={(e) => { setPeriodFilter(e.target.value); setCurrentPage(1); }} className="form-select" style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', minWidth: '150px' }}>
            <option value="">Period (Year)</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>

          <button onClick={() => setCurrentPage(1)} className="btn btn-primary btn-sm" style={{ backgroundColor: '#1e293b', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
            Filter
          </button>
          
          <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
            Reset
          </button>
        </div>

        <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" style={{ backgroundColor: '#1e293b', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, border: 'none' }}>
          <Download size={15} style={{ marginRight: '6px' }} />
          Export
        </button>
      </div>

      <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Record ID</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('memberName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Member Name</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'memberName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Savings Amount (£)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'amount' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('goal')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Savings Goal</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'goal' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                
                <th onClick={() => requestSort('collectionMonth')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Collection Month</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'collectionMonth' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('endDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Collection Year</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'endDate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Status</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentCommitments.map((cmt) => (
                <tr key={cmt.id} className={styles.tableRow}>
                  <td className={styles.idCell} style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} onClick={() => handleOpenViewModal(cmt)}>
                    {cmt.id}
                  </td>
                  <td>
                    <div className={styles.userNameWrap}>
                      <span className={styles.userName}>{cmt.memberName}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#16a34a' }}>£{Number(cmt.amount).toFixed(2)}</td>
                  <td>{cmt.goal || 'Savings Goal'}</td>
                  
                  <td className={styles.dateCell}>{cmt.collectionMonth} {cmt.collectionYear}</td>
                  <td className={styles.dateCell}>{cmt.collectionYear}</td>
                  <td>
                    <span className={`status-pill ${cmt.status.toLowerCase().replace(/_/g, '-')}`}>
                      {cmt.status === 'PENDING' ? 'Pending' : cmt.status.charAt(0).toUpperCase() + cmt.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {currentCommitments.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    No savings commitments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
      {/* --- VIEW COMMITMENT DETAILS MODAL --- */}
      {activeModal === 'VIEW_COMMITMENT' && selectedCmt && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <PoundSterling size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', margin: 0 }}>Saving Commitment</h3>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', paddingLeft: '30px' }}>{selectedCmt.id}</div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Record ID</span>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', marginTop: '4px', fontSize: '0.85rem' }}>{selectedCmt.id}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Name</span>
                <div style={{ marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      router.push(`/dashboard/users?search=${encodeURIComponent(selectedCmt.memberName)}`);
                      setActiveModal('NONE');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Go to Manage Users"
                  >
                    {selectedCmt.memberName}
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collection Month</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{selectedCmt.collectionMonth} {selectedCmt.collectionYear}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Amount (£)</span>
                <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '4px', fontSize: '1rem' }}>£{Number(selectedCmt.amount).toFixed(2)}</div>
              </div>
              
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`status-pill ${selectedCmt.status.toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.72rem' }}>
                    {selectedCmt.status === 'PENDING' ? 'Pending' : selectedCmt.status.charAt(0).toUpperCase() + selectedCmt.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History Table */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</h4>
            {viewCmtLoading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading payments...</div>
            ) : viewCmtPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                No payments logged yet for this commitment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SR.NO.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Month</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Year</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCmtPayments.map((pay, i) => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle, #fafafa)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{pay.month}</td>
                        <td style={{ padding: '10px 14px' }}>{pay.year}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
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
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ borderRadius: '8px', padding: '8px 22px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
