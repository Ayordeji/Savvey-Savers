'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  X,
  ClipboardList,
  CheckSquare,
  Trash2,
  ArrowRightLeft,
  Search,
  Download,
  Plus,
  ChevronDown,
  MoreVertical,
  Users,
  UserPlus,
  Mail,
  CheckCircle,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';

interface WaitingListEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthlySavingsCommitment: number;
  isReferred: boolean;
  referredBy?: string;
  createdAt: string;
  intendedPool?: string;
  targetMonth?: string;
  status?: string;
}

export default function WaitingListPage() {
  const dialog = useDialog();
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Convert modal states
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add Prospect Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAmount, setAddAmount] = useState('100');
  const [addPool, setAddPool] = useState('July - High Yield');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/admin/waiting-list');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Error fetching waiting list entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleOpenConvertModal = (entry: WaitingListEntry) => {
    setOpenDropdownId(null);
    setErrorMsg('');
    setSelectedEntry(entry);
    setConvertModalOpen(true);
  };

  const handleConvert = async (inviteMode: 'SAVE' | 'SAVE_INVITE') => {
    if (!selectedEntry) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitingListId: selectedEntry.id,
          inviteMode
        })
      });

      if (res.ok) {
        fetchEntries();
        setConvertModalOpen(false);
        await dialog.alert('Prospect Converted', `${selectedEntry.name} has been approved and welcomed to Savvey Savers.`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to convert prospect.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (id: string) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Decline Application', 'Are you sure you want to decline this waiting list application?'))) return;
    try {
      const res = await fetch(`/api/admin/waiting-list?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchEntries();
      } else {
        await dialog.alert('Decline Failed', 'Failed to decline application.');
      }
    } catch (err) {
      console.error('Error declining waiting list application:', err);
    }
  };

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail || !addPhone) {
      setErrorMsg('Name, email, and phone are required.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/waiting-list/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          phone: addPhone,
          monthlySavingsCommitment: parseFloat(addAmount) || 100,
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAddModalOpen(false);
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddAmount('100');
        await fetchEntries();
        await dialog.alert('Prospect Added', `${addName} has been registered on the waiting list.`);
      } else {
        setErrorMsg(data.error || 'Failed to add prospect. Please try again.');
      }
    } catch (err) {
      console.error('Error adding prospect:', err);
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const getProspectDisplayId = (e: WaitingListEntry) => (e as any).displayId || e.id;

  const handleExport = () => {
    const csvRows = [
      ['Prospect ID', 'Name', 'Email', 'Phone', 'Commitment', 'Date Added'].join(',')
    ];
    entries.forEach(e => {
      csvRows.push([
        getProspectDisplayId(e),
        `"${e.name}"`,
        `"${e.email}"`,
        `"${e.phone}"`,
        `£${e.monthlySavingsCommitment}`,
        new Date(e.createdAt).toLocaleDateString('en-GB')
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPI Calculations strictly from database records
  const totalProspects = entries.length;
  const newProspects = entries.filter(e => !e.status || e.status === 'NEW' || e.status === 'PENDING').length;
  const contactedProspects = entries.filter(e => e.status === 'CONTACTED').length;
  const convertedProspects = entries.filter(e => e.status === 'CONVERTED').length;

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const displayId = getProspectDisplayId(e).toLowerCase();
        const matches =
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.phone.includes(q) ||
          displayId.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [entries, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / itemsPerPage));
  const paginatedEntries = useMemo(() => {
    return filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedEntries.map(e => e.id)));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header (Matches Screenshot 6) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Prospect Waiting List
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Review and manage potential members expressing interest in joining Savvey Savers.
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

          <button
            onClick={() => { setErrorMsg(''); setAddModalOpen(true); }}
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
            <span>Add Prospect</span>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </button>
        </div>
      </div>

      {/* 4 KPI Progress Cards (Screenshot 6) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Prospects */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Prospects</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {totalProspects}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>All registered prospects</span>
        </div>

        {/* Card 2: New Prospects */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>New Prospects</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {newProspects}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Requires initial contact</span>
        </div>

        {/* Card 3: Contacted */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Contacted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {contactedProspects}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>In active communication</span>
        </div>

        {/* Card 4: Converted */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Converted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {convertedProspects}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Successfully onboarded</span>
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
              placeholder="Search by name, email, or ID..."
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
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="CONVERTED">Converted</option>
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

      {/* Prospects Table */}
      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Waiting List...</span>
        </div>
      ) : (
        <div className="table-container" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', overflow: 'hidden' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
                <th style={{ width: '36px', textAlign: 'center', padding: '14px 10px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedEntries.length > 0 && paginatedEntries.every(e => selectedIds.has(e.id))}
                    ref={el => { if (el) el.indeterminate = paginatedEntries.some(e => selectedIds.has(e.id)) && !paginatedEntries.every(e => selectedIds.has(e.id)); }}
                    onChange={e => handleSelectAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2E5A44', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PROSPECT ID
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PROSPECT
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  INTENDED POOL
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SAVINGS AMOUNT
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TARGET MONTH
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STATUS
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DATE ADDED
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                    No pending applications on the waiting list.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((e) => {
                  const initials = e.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PR';
                  const displayId = getProspectDisplayId(e);
                  const poolName = e.intendedPool || (e.monthlySavingsCommitment ? `£${Number(e.monthlySavingsCommitment).toFixed(0)}/mo Commitment` : 'Standard Pool');
                  const targetMonth = e.targetMonth || 'Open Cycle';
                  const status = e.status || (e.isReferred ? 'REFERRED' : 'PENDING');

                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid #ECE8E2', transition: 'background-color 0.15s ease' }}>
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(e.id)}
                          onChange={ev => handleSelectRow(e.id, ev.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#0c4e43', cursor: 'pointer' }}
                        />
                      </td>

                      {/* Prospect ID Monospace Pill */}
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

                      {/* Prospect Name & Avatar */}
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
                              {e.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                              {e.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Intended Pool */}
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#4B5563' }}>
                        {poolName}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                        £{Number(e.monthlySavingsCommitment).toFixed(2)}
                      </td>

                      {/* Target Month */}
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                        {targetMonth}
                      </td>

                      {/* Status Pill */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: status === 'NEW' ? '#EAF5EE' : status === 'CONTACTED' ? '#FEF3C7' : '#EEF2FF',
                          color: status === 'NEW' ? '#2E7D32' : status === 'CONTACTED' ? '#B45309' : '#4F46E5'
                        }}>
                          {status}
                        </span>
                      </td>

                      {/* Date Added */}
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                        {new Date(e.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === e.id ? null : e.id)}
                          style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openDropdownId === e.id && (
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
                              onClick={() => handleOpenConvertModal(e)}
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
                              <ArrowRightLeft size={14} />
                              <span>Approve & Convert</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                window.location.href = `mailto:${e.email}?subject=Savvey Savers Waiting List`;
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
                              <Mail size={14} />
                              <span>Contact Prospect</span>
                            </button>

                            <button
                              onClick={() => handleDecline(e.id)}
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
                              <span>Decline Application</span>
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
        totalItems={filteredEntries.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
        itemLabel="prospect"
      />

      {/* --- ADD PROSPECT MODAL --- */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAddModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setAddModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: '#111827' }}>
              Add New Prospect
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0, marginBottom: '20px' }}>
              Register a prospective member expressing interest in joining.
            </p>

            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '0.84rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddProspect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olamide Adeleke"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. olamide@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+44 7700 900000"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Intended Monthly Amount (£)</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Intended Pool</label>
                  <select
                    value={addPool}
                    onChange={(e) => setAddPool(e.target.value)}
                    className="form-select"
                  >
                    <option value="July - High Yield">July - High Yield</option>
                    <option value="August - Standard">August - Standard</option>
                    <option value="General Rotating Pool">General Rotating Pool</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid #ECE8E2', background: '#FFFFFF', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '9px 22px', borderRadius: '10px', border: 'none', background: '#2E5A44', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {submitting ? 'Adding...' : 'Add Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONVERT MODAL --- */}
      {convertModalOpen && selectedEntry && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConvertModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setConvertModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: '#111827' }}>
              Convert Prospect to Member
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0, marginBottom: '20px' }}>
              Approve {selectedEntry.name}&apos;s waiting list application. Choose how to welcome them.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', fontSize: '0.88rem' }}>
                <div style={{ marginBottom: '6px' }}><strong style={{ color: '#111827' }}>Prospect:</strong> {selectedEntry.name}</div>
                <div style={{ marginBottom: '6px' }}><strong style={{ color: '#111827' }}>Email:</strong> {selectedEntry.email}</div>
                <div><strong style={{ color: '#111827' }}>Commitment:</strong> £{selectedEntry.monthlySavingsCommitment}/month</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.4, margin: 0 }}>
                <strong>Save Record</strong>: Saves details and sends welcome email.<br />
                <strong>Save & Invite</strong>: Sends welcome email with unique password activation link.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleConvert('SAVE')}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #ECE8E2',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Record
              </button>
              <button
                onClick={() => handleConvert('SAVE_INVITE')}
                disabled={submitting}
                style={{
                  flex: 1.2,
                  padding: '10px',
                  backgroundColor: '#2E5A44',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save & Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
