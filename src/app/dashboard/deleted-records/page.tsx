'use client';

import { useState, useEffect } from 'react';
import { Eye, X, ShieldAlert, Trash2 } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

interface DeletedRecord {
  id: string;
  type: 'USER' | 'COMMITMENT';
  originalData: any;
  deletedAt: string;
}

export default function DeletedRecordsPage() {
  const dialog = useDialog();
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DeletedRecord | null>(null);
 
  const handleClearArchive = async () => {
    if (!(await dialog.confirm('Empty Archive', 'Are you sure you want to empty the deleted records archive totally? This action is permanent and cannot be undone.'))) return;
    try {
      const res = await fetch('/api/admin/deleted-records', { method: 'DELETE' });
      if (res.ok) {
        setRecords([]);
      } else {
        await dialog.alert('Error', 'Failed to empty deleted records archive.');
      }
    } catch (err) {
      console.error('Error emptying archive:', err);
    }
  };

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

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to extract a friendly summary label of the deleted data
  const getFriendlyDetails = (r: DeletedRecord) => {
    const data = r.originalData;
    if (r.type === 'USER') {
      return `Member: ${data.name} (${data.email}) - Tier: ${data.membership || 'None'}`;
    } else {
      return `Commitment: £${data.amount}/mo savings cycle for "${data.goal}" (Payout scheduled: ${data.collectionMonth} ${data.collectionYear})`;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Deleted Records & Audit Archive
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Non-destructive archive of deleted members and cancelled commitments for auditing, compliance, and dispute resolution.
          </p>
        </div>
        {records.length > 0 && (
          <button
            onClick={handleClearArchive}
            className="btn btn-secondary"
            style={{ borderColor: 'var(--status-cancelled)', color: 'var(--status-cancelled)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={16} />
            <span>Empty Archive</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Archived Records...</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Archive ID</th>
                <th>Record Type</th>
                <th>Archived Record Summary</th>
                <th>Deletion Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No deleted or cancelled records archived yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.id}
                    </td>
                    <td>
                      <span className={`status-pill ${r.type === 'USER' ? 'active' : 'cancelled'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{getFriendlyDetails(r)}</td>
                    <td>{formatDate(r.deletedAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="View Full Metadata"
                      >
                        <Eye size={14} />
                        <span>Inspect Raw JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button onClick={() => setSelectedRecord(null)} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} style={{ color: 'var(--status-pending)' }} />
              <span>Inspect Archived Metadata</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Read-only metadata captured at deletion time for record {selectedRecord.id}.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Archive Properties
              </div>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Archive ID</td><td style={{ fontFamily: 'monospace' }}>{selectedRecord.id}</td></tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Record Type</td><td>{selectedRecord.type}</td></tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Archived At</td><td>{formatDate(selectedRecord.deletedAt)}</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Original Record Data
              </div>
              <pre style={{
                maxHeight: '220px',
                overflow: 'auto',
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                lineHeight: 1.4
              }}>
                {JSON.stringify(selectedRecord.originalData, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
                Purging or Restoring is locked in v1.0
              </span>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary btn-sm">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
