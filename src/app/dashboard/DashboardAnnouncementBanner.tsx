'use client';

import { useState, useEffect } from 'react';
import { Megaphone, AlertTriangle, Info, CheckCircle2, AlertCircle, X, Edit, Plus, Eye, EyeOff } from 'lucide-react';

interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  targetAudience: 'ALL' | 'MEMBERS' | 'ADMINS';
  updatedAt?: string;
  updatedBy?: string;
}

export default function DashboardAnnouncementBanner({ isAdmin }: { isAdmin: boolean }) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [formEnabled, setFormEnabled] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT'>('INFO');
  const [formAudience, setFormAudience] = useState<'ALL' | 'MEMBERS' | 'ADMINS'>('ALL');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
        setFormEnabled(data.enabled || false);
        setFormTitle(data.title || '');
        setFormMessage(data.message || '');
        setFormType(data.type || 'INFO');
        setFormAudience(data.targetAudience || 'ALL');

        // Check if user previously dismissed this exact announcement revision
        if (data.updatedAt) {
          const dismissedId = sessionStorage.getItem('dismissed_announcement');
          if (dismissedId === data.updatedAt) {
            setIsDismissed(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement?.updatedAt) {
      sessionStorage.setItem('dismissed_announcement', announcement.updatedAt);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: formEnabled,
          title: formTitle,
          message: formMessage,
          type: formType,
          targetAudience: formAudience
        })
      });

      if (res.ok) {
        const result = await res.json();
        setAnnouncement(result.announcement);
        setIsDismissed(false);
        setIsModalOpen(false);
      } else {
        const errData = await res.json();
        setStatusMsg(errData.error || 'Failed to save announcement.');
      }
    } catch (err) {
      setStatusMsg('A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const typeStyles = {
    INFO: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#166534',
      badgeBg: '#DCFCE7',
      icon: <Info size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
    },
    WARNING: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      badgeBg: '#FEF3C7',
      icon: <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
    },
    SUCCESS: {
      bg: '#F0FDF4',
      border: '#86EFAC',
      text: '#14532D',
      badgeBg: '#DCFCE7',
      icon: <CheckCircle2 size={18} style={{ color: '#15803D', flexShrink: 0 }} />
    },
    URGENT: {
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
      badgeBg: '#FEE2E2',
      icon: <AlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
    }
  };

  const currentType = announcement?.type || 'INFO';
  const currentStyle = typeStyles[currentType] || typeStyles.INFO;

  return (
    <>
      {/* Banner view if active & not dismissed */}
      {announcement?.enabled && !isDismissed && (
        <div
          style={{
            backgroundColor: currentStyle.bg,
            border: `1px solid ${currentStyle.border}`,
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: '20px',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
            <div style={{ marginTop: '2px' }}>{currentStyle.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: currentStyle.text }}>
                  {announcement.title || 'Platform Announcement'}
                </span>
                {isAdmin && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: currentStyle.badgeBg,
                      color: currentStyle.text
                    }}
                  >
                    Audience: {announcement.targetAudience}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: currentStyle.text,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line'
                }}
              >
                {announcement.message}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title="Edit announcement"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${currentStyle.border}`,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: currentStyle.text,
                  cursor: 'pointer'
                }}
              >
                <Edit size={13} />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss announcement"
              style={{
                background: 'none',
                border: 'none',
                color: currentStyle.text,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Admin Post Announcement Bar when disabled or dismissed */}
      {isAdmin && (!announcement?.enabled || isDismissed) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECE8E2',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Megaphone size={14} style={{ color: '#0c4e43' }} />
            <span>{announcement?.enabled ? 'Manage Announcement' : '+ Post Dashboard Announcement'}</span>
          </button>
        </div>
      )}

      {/* --- ADMIN EDIT ANNOUNCEMENT MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', right: '20px', top: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Megaphone size={20} style={{ color: '#0c4e43' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                Dashboard Announcement
              </h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.84rem', marginBottom: '18px' }}>
              Publish an alert banner displayed at the top of member and admin dashboards.
            </p>

            {statusMsg && (
              <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '16px' }}>
                {statusMsg}
              </div>
            )}

            <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Toggle Enabled */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAF9F6', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ECE8E2' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>Publish Announcement</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Toggle visibility on the dashboard</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: formEnabled ? '#15803D' : '#D1D5DB',
                      borderRadius: '24px',
                      transition: '0.2s'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: formEnabled ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '50%',
                        transition: '0.2s'
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Title */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required={formEnabled}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Important Notice: Updated 2027 Fee Schedule"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
                />
              </div>

              {/* Message */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                  Message *
                </label>
                <textarea
                  rows={4}
                  required={formEnabled}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Enter details of the announcement here..."
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', fontFamily: 'inherit' }}
                />
              </div>

              {/* Type & Audience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Banner Style
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="form-select"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  >
                    <option value="INFO">Information (Blue/Teal)</option>
                    <option value="WARNING">Important Notice (Amber)</option>
                    <option value="SUCCESS">Success / Good News (Green)</option>
                    <option value="URGENT">Urgent Action Required (Red)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Target Audience
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="form-select"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">Everyone (Members & Admins)</option>
                    <option value="MEMBERS">Members Only</option>
                    <option value="ADMINS">Admins Only</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '8px', padding: '9px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#0c4e43', color: '#FFFFFF', borderRadius: '8px', padding: '9px 20px', fontWeight: 600 }}
                >
                  {saving ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
