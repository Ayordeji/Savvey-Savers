'use client';

import { useState, useEffect } from 'react';
import { Check, X, ClipboardList, CheckSquare, Trash2, ArrowRightLeft } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

interface WaitingListEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthlySavingsCommitment: number;
  isReferred: boolean;
  referredBy?: string;
  createdAt: string;
}

export default function WaitingListPage() {
  const dialog = useDialog();
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert modal states
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      console.error('Decline error:', err);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
          Prospect Waiting List
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Review applications from interested individuals. Convert them to active savers with automatic commitment setups.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Waiting List...</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Prospect ID</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Savings Goal Intended</th>
                <th>Referred By</th>
                <th>Application Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No pending applications on the waiting list.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {e.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td>{e.email}</td>
                    <td>{e.phone}</td>
                    <td>£{e.monthlySavingsCommitment} / month</td>
                    <td>{e.isReferred ? e.referredBy || 'Yes' : 'No'}</td>
                    <td>{formatDate(e.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenConvertModal(e)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Convert to Member"
                        >
                          <ArrowRightLeft size={14} />
                          <span>Approve & Convert</span>
                        </button>
                        <button
                          onClick={() => handleDecline(e.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Decline Application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- CONVERT MODAL --- */}
      {convertModalOpen && selectedEntry && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setConvertModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Convert Prospect to Member
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Approve {selectedEntry.name}&apos;s waiting list application. Choose how to welcome them.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '4px' }}><strong>Prospect:</strong> {selectedEntry.name}</div>
                <div style={{ marginBottom: '4px' }}><strong>Email:</strong> {selectedEntry.email}</div>
                <div><strong>Commitment:</strong> £{selectedEntry.monthlySavingsCommitment}/month</div>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong>Save Record</strong>: Saves details and sends welcome email (no dashboard link).<br />
                <strong>Save & Invite</strong>: Sends welcome email with unique password activation link.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleConvert('SAVE')}
                disabled={submitting}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Save Record
              </button>
              <button
                onClick={() => handleConvert('SAVE_INVITE')}
                disabled={submitting}
                className="btn btn-primary"
                style={{ flex: 1.2 }}
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
