'use client';

import { useState, useEffect } from 'react';
import { Mail, Trash2, MailOpen, RefreshCw } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import styles from './mailbox.module.css';

interface MockEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export default function MockMailboxPage() {
  const dialog = useDialog();
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/dev/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
        // Reselect if already selected
        if (selectedEmail) {
          const updated = data.find((e: MockEmail) => e.id === selectedEmail.id);
          setSelectedEmail(updated || null);
        }
      }
    } catch (err) {
      console.error('Error fetching mock emails:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  const handleClear = async () => {
    if (!(await dialog.confirm('Clear Mailbox', 'Are you sure you want to clear the entire local mock mailbox?'))) return;
    try {
      const res = await fetch('/api/dev/emails', { method: 'DELETE' });
      if (res.ok) {
        setEmails([]);
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Error clearing mailbox:', err);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  // Convert URLs in body to clickable anchors safely
  const renderBody = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--primary)' }}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Mock Mailbox Utility
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Verify transactional emails triggered locally without an active SMTP server.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleRefresh} className="btn btn-secondary btn-sm" disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'loading-spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={handleClear} className="btn btn-danger btn-sm" disabled={emails.length === 0}>
            <Trash2 size={14} />
            <span>Clear Inbox</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Inbox...</span>
        </div>
      ) : (
        <div className={styles.mailboxContainer}>
          {/* Left panel: List */}
          <div className={styles.mailList}>
            <div className={styles.listHeader}>
              <span className={styles.listTitle}>Inbox ({emails.length})</span>
            </div>
            <div className={styles.emailItems}>
              {emails.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No emails sent yet
                </div>
              ) : (
                emails.map((email) => {
                  const isSelected = selectedEmail?.id === email.id;
                  return (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`${styles.emailItem} ${isSelected ? styles.selectedItem : ''}`}
                    >
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTo}>{email.to}</span>
                        <span className={styles.itemTime}>{formatTime(email.sentAt)}</span>
                      </div>
                      <div className={styles.itemSubject}>{email.subject}</div>
                      <div className={styles.itemBodyPreview}>{email.body}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Detail */}
          <div className={styles.mailDetail}>
            {selectedEmail ? (
              <>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailSubject}>{selectedEmail.subject}</h3>
                  <div className={styles.detailMeta}>
                    <div>
                      <div className={styles.metaRow}>
                        <strong>To:</strong> {selectedEmail.to}
                      </div>
                      <div className={styles.metaRow}>
                        <strong>From:</strong> Savvey Savers Team &lt;noreply@savveysavers.crevianstudios.com&gt;
                      </div>
                    </div>
                    <div>
                      <strong>Date:</strong> {formatTime(selectedEmail.sentAt)}
                    </div>
                  </div>
                </div>
                <div className={styles.detailBody}>
                  {renderBody(selectedEmail.body)}
                </div>
                <div className={styles.detailActions}>
                  <MailOpen size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Email loaded. You can click on activation links inside the body to test registration flows.
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.emptyDetail}>
                <Mail size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <span>Select an email from the list to view its contents</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
