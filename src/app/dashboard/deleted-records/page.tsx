'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  X,
  ShieldAlert,
  Trash2,
  Archive,
  Clock,
  RotateCcw,
  Search,
  ChevronDown,
  MoreVertical,
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';

interface DeletedRecord {
  id: string;
  type: string;
  originalData: any;
  deletedAt: string;
}

export default function DeletedRecordsPage() {
  const dialog = useDialog();
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DeletedRecord | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/admin/deleted-records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Error fetching archived records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleClearArchive = async () => {
    if (!(await dialog.confirm('Empty Archive', 'Are you sure you want to permanently clear the deleted records archive? All restorable items will be permanently erased.'))) return;
    try {
      const res = await fetch('/api/admin/deleted-records', { method: 'DELETE' });
      if (res.ok) {
        setRecords([]);
        setDrawerOpen(false);
        setSelectedRecord(null);
        await dialog.alert('Archive Cleared', 'The archive has been emptied.');
      } else {
        await dialog.alert('Error', 'Failed to empty deleted records archive.');
      }
    } catch (err) {
      console.error('Error emptying archive:', err);
    }
  };

  const handlePermanentDelete = async (recordId: string) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Permanently Delete', 'Are you sure you want to permanently erase this record? It cannot be recovered.'))) return;
    try {
      const res = await fetch(`/api/admin/deleted-records?id=${recordId}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== recordId));
        if (selectedRecord?.id === recordId) {
          setDrawerOpen(false);
          setSelectedRecord(null);
        }
        await dialog.alert('Record Deleted', 'The record was permanently deleted.');
      } else {
        await dialog.alert('Error', 'Failed to delete record.');
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  const handleRestore = async (record: DeletedRecord) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Restore Record', `Are you sure you want to restore this ${record.type.toLowerCase()} record back to active records?`))) return;
    try {
      const res = await fetch('/api/admin/deleted-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESTORE',
          id: record.id
        })
      });

      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== record.id));
        if (selectedRecord?.id === record.id) {
          setDrawerOpen(false);
          setSelectedRecord(null);
        }
        await dialog.alert('Record Restored', `${record.type} record restored successfully.`);
      } else {
        const data = await res.json();
        await dialog.alert('Restore Failed', data.error || 'Failed to restore record.');
      }
    } catch (err) {
      console.error('Error restoring record:', err);
      await dialog.alert('Error', 'A network error occurred while restoring.');
    }
  };

  const getRecordTitle = (r: DeletedRecord) => {
    const data = r.originalData;
    if (r.type === 'USER' || r.type === 'MEMBER') {
      return data?.name || `${data?.firstName || ''} ${data?.lastName || ''}`.trim() || data?.email || 'User Record';
    }
    if (r.type === 'SAVINGS COMMITMENT' || r.type === 'COMMITMENT') {
      return data?.displayId || `Savings Commitment (£${data?.amount || '0'}/mo)`;
    }
    if (r.type === 'INVITATION') {
      return data?.email || 'Invitation';
    }
    if (r.type === 'PAYMENT') {
      return `Payment £${data?.amount || '0'} (${data?.month || ''})`;
    }
    return data?.name || data?.title || `${r.type} Record`;
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedTime = new Date(deletedAt).getTime();
    const expiryTime = deletedTime + 90 * 86400000;
    const diffDays = Math.max(0, Math.ceil((expiryTime - Date.now()) / 86400000));
    return `${diffDays} days left`;
  };

  const getTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('USER') || t.includes('MEMBER')) {
      return { bg: '#EAF5EE', color: '#2E7D32', label: 'USER' };
    }
    if (t.includes('COMMITMENT')) {
      return { bg: '#EBF5FF', color: '#2563EB', label: 'SAVINGS COMMITMENT' };
    }
    if (t.includes('INVITATION')) {
      return { bg: '#F3E8FF', color: '#7E22CE', label: 'INVITATION' };
    }
    if (t.includes('PAYMENT')) {
      return { bg: '#FEF3C7', color: '#B45309', label: 'PAYMENT' };
    }
    return { bg: '#F3F4F6', color: '#4B5563', label: t };
  };

  // KPI calculations
  const totalArchived = records.length;
  const deletedThisMonth = records.filter(r => new Date(r.deletedAt).getMonth() === new Date().getMonth()).length;
  const restorableCount = records.length;
  const permanentPurgeCount = 0;

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (typeFilter && !r.type.toUpperCase().includes(typeFilter.toUpperCase())) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const title = getRecordTitle(r).toLowerCase();
        const displayId = `del-${r.id.substring(0, 5).toLowerCase()}`;
        if (!title.includes(q) && !displayId.includes(q) && !r.type.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, typeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header (Screenshot 7) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Deleted Records
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Audit trail and recovery archive for soft-deleted platform entities.
          </p>
        </div>

        {records.length > 0 && (
          <button
            onClick={handleClearArchive}
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
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
            <Trash2 size={15} />
            <span>Empty Archive</span>
          </button>
        )}
      </div>

      {/* 4 KPI Progress Cards (Screenshot 7) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Archived */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Archived</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Archive size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {totalArchived}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>All archived items</span>
        </div>

        {/* Card 2: Deleted This Month */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Deleted This Month</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {deletedThisMonth}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Archived in current cycle</span>
        </div>

        {/* Card 3: Restorable */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Restorable</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {restorableCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Eligible for instant restore</span>
        </div>

        {/* Card 4: Permanent Purge */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Permanent Purge</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {permanentPurgeCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Past 90-day retention</span>
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
              placeholder="Search archived records by name, ID..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            <option value="">Entity Types: All</option>
            <option value="USER">Users</option>
            <option value="COMMITMENT">Savings Commitments</option>
            <option value="INVITATION">Invitations</option>
            <option value="PAYMENT">Payments</option>
          </select>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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

      {/* Main Content Area: Table + Slide-Out Drawer (Screenshot 7) */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Side: Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
              <div className="loading-spinner"></div>
              <span style={{ color: 'var(--text-muted)' }}>Loading Archived Records...</span>
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
                      RECORD ID
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ENTITY TYPE
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      RECORD NAME / TITLE
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      DELETED BY
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      DELETED DATE
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      RETENTION
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                        No deleted records found in archive.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((r) => {
                      const displayId = `DEL-${r.id.substring(0, 5).toUpperCase()}`;
                      const typeStyle = getTypeStyle(r.type);
                      const recordTitle = getRecordTitle(r);
                      const isSelected = selectedRecord?.id === r.id && drawerOpen;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => {
                            setSelectedRecord(r);
                            setDrawerOpen(true);
                          }}
                          style={{
                            cursor: 'pointer',
                            borderBottom: '1px solid #ECE8E2',
                            backgroundColor: isSelected ? '#FAF9F6' : undefined,
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center', padding: '14px 10px' }} onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#2E5A44' }} />
                          </td>

                          {/* Record ID Monospace Pill */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              backgroundColor: '#EAF5EE',
                              color: '#2E5A44'
                            }}>
                              {displayId}
                            </span>
                          </td>

                          {/* Entity Type Badge */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 9px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: typeStyle.bg,
                              color: typeStyle.color
                            }}>
                              {typeStyle.label}
                            </span>
                          </td>

                          {/* Record Name */}
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                            {recordTitle}
                          </td>

                          {/* Deleted By */}
                          <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                            Iyore (Admin)
                          </td>

                          {/* Deleted Date */}
                          <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                            {new Date(r.deletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>

                          {/* Retention */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}>
                              {getDaysRemaining(r.deletedAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleRestore(r)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: '#2E5A44',
                                  backgroundColor: '#EAF5EE',
                                  border: '1px solid #A7F3D0',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <RotateCcw size={12} />
                                <span>Restore</span>
                              </button>

                              <button
                                onClick={() => setOpenDropdownId(openDropdownId === r.id ? null : r.id)}
                                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>

                            {openDropdownId === r.id && (
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
                                  onClick={() => {
                                    setSelectedRecord(r);
                                    setDrawerOpen(true);
                                    setOpenDropdownId(null);
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
                                  <span>View Snapshot</span>
                                </button>

                                <button
                                  onClick={() => handlePermanentDelete(r.id)}
                                  style={{
                                    padding: '8px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: '#DC2626',
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
                                  <Trash2 size={14} />
                                  <span>Permanently Delete</span>
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
          <div style={{ marginTop: '16px' }}>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRecords.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
              itemLabel="archived record"
            />
          </div>
        </div>

        {/* Right Side: Slide-Out View Deleted Record Drawer (Screenshot 7) */}
        {drawerOpen && selectedRecord && (
          <div
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
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                View Deleted Record
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Record Summary Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: getTypeStyle(selectedRecord.type).bg,
                  color: getTypeStyle(selectedRecord.type).color
                }}>
                  {getTypeStyle(selectedRecord.type).label}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#EAF5EE', color: '#2E5A44', padding: '2px 6px', borderRadius: '4px' }}>
                  DEL-{selectedRecord.id.substring(0, 5).toUpperCase()}
                </span>
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                {getRecordTitle(selectedRecord)}
              </h4>
            </div>

            {/* Archive Information Card */}
            <div style={{ backgroundColor: '#FAF9F6', borderRadius: '14px', padding: '16px', border: '1px solid #ECE8E2' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                Archive Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Archived On</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>
                    {new Date(selectedRecord.deletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Deleted By</span>
                  <span style={{ color: '#111827', fontWeight: 600 }}>Iyore (Admin)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Retention Window</span>
                  <span style={{ color: '#111827' }}>90 Days Total</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Days Remaining</span>
                  <span style={{ color: '#B45309', fontWeight: 700 }}>{getDaysRemaining(selectedRecord.deletedAt)}</span>
                </div>
              </div>
            </div>

            {/* Record Snapshot Card */}
            <div style={{ backgroundColor: '#FAF9F6', borderRadius: '14px', padding: '16px', border: '1px solid #ECE8E2' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                Record Snapshot
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #ECE8E2', fontSize: '0.75rem', fontFamily: 'monospace', color: '#374151' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(selectedRecord.originalData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => handleRestore(selectedRecord)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2E5A44',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={15} />
                <span>Restore Record</span>
              </button>

              <button
                onClick={() => handlePermanentDelete(selectedRecord.id)}
                style={{
                  width: '100%',
                  padding: '9px',
                  backgroundColor: 'transparent',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
