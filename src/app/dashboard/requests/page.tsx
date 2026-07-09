'use client';

import { useState, useEffect } from 'react';
import { Check, X, ClipboardList, CheckSquare, AlertTriangle } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

interface SubmittedRequest {
  id: string;
  userId: string;
  saverName: string;
  savingsGoal: string;
  amount: number;
  requestedMonth: string;
  requestedYear: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function SubmittedRequestsPage() {
  const dialog = useDialog();
  const [requests, setRequests] = useState<SubmittedRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
      // Check admin status implicitly
      const userRes = await fetch('/api/admin/users');
      setIsAdmin(userRes.status !== 403);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const verb = action === 'APPROVE' ? 'approve' : 'decline';
    const title = action === 'APPROVE' ? 'Approve Request' : 'Decline Request';
    const confirmation = await dialog.confirm(title, `Are you sure you want to ${verb} this collection month request?`);
    if (!confirmation) return;
 
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
 
      if (res.ok) {
        fetchRequests();
      } else {
        const data = await res.json();
        await dialog.alert('Request Failed', data.error || 'Failed to process request');
      }
    } catch (err) {
      console.error('Error sending request action:', err);
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
          Collection Month Requests
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          {isAdmin
            ? 'Review and approve member requests for their scheduled harvest payout months.'
            : 'Track the status of your submitted collection month requests.'}
        </p>
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Requests...</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Saver Name</th>
                <th>Savings Goal</th>
                <th>Amount</th>
                <th>Requested Month</th>
                <th>Request Date</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No collection month requests submitted yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.saverName}</td>
                    <td>{r.savingsGoal}</td>
                    <td>£{r.amount}</td>
                    <td>{r.requestedMonth} {r.requestedYear}</td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>
                      <span className={`status-pill ${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'PENDING' ? (
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleAction(r.id, 'APPROVE')}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 10px', backgroundColor: 'var(--status-success)' }}
                              title="Approve Request"
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleAction(r.id, 'REJECT')}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '6px 10px' }}
                              title="Decline Request"
                            >
                              <X size={14} />
                              <span>Decline</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Resolved
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
