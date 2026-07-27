'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, Plus, Save, Eye, Edit, Trash2, X, MoreVertical, FileText, CheckSquare, Bell } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

interface SavingGoal {
  name: string;
  enabled: boolean;
}

interface CommitmentAmount {
  amount: number;
  enabled: boolean;
}

interface EmailTemplate {
  id: string;
  title: string;
  reminderHours: string;
  subject: string;
  body: string;
  enabled?: boolean;
}

function SettingsContent() {
  const dialog = useDialog();
  const searchParams = useSearchParams();

  // Tab State: 'security' | 'commitment' | 'email-templates' | 'migration'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'security' | 'commitment' | 'email-templates' | 'migration'>('security');

  // Migration Panel State
  const [migrationMode, setMigrationMode] = useState<'CSV' | 'JSON'>('CSV');
  const [migrationCsvText, setMigrationCsvText] = useState('');
  const [migrationJson, setMigrationJson] = useState('');
  const [migrationOverwrite, setMigrationOverwrite] = useState(true);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const [migrationError, setMigrationError] = useState('');

  // Helper to parse CSV/TSV text into migration JSON payload
  const parseCsvToPayload = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { users: [], commitments: [] };

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const idxMemberId = getIdx(['member id', 'memberid', 'invitation id', 'invitationid', 'display id', 'code']);
    const idxName = getIdx(['name', 'full name', 'fullname', 'member name']);
    const idxEmail = getIdx(['email', 'mail']);
    const idxPhone = getIdx(['phone', 'mobile', 'tel', 'contact']);
    const idxRole = getIdx(['role']);
    const idxRecordId = getIdx(['record id', 'commitment id', 'recordid', 'commitmentid', 'id']);
    const idxAmount = getIdx(['amount', 'savings', 'commitment']);
    const idxGoal = getIdx(['goal', 'purpose', 'savings goal']);
    const idxMonth = getIdx(['month', 'collection month']);
    const idxYear = getIdx(['year', 'collection year']);
    const idxStatus = getIdx(['status', 'state']);

    const users: any[] = [];
    const commitments: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;

      const email = idxEmail !== -1 && cols[idxEmail] ? cols[idxEmail] : '';
      const memberId = idxMemberId !== -1 && cols[idxMemberId] ? cols[idxMemberId] : '';
      const name = idxName !== -1 && cols[idxName] ? cols[idxName] : '';
      const phone = idxPhone !== -1 && cols[idxPhone] ? cols[idxPhone] : '';
      const role = idxRole !== -1 && cols[idxRole] ? cols[idxRole] : 'MEMBER';
      const recordId = idxRecordId !== -1 && cols[idxRecordId] ? cols[idxRecordId] : '';
      const rawAmount = idxAmount !== -1 && cols[idxAmount] ? cols[idxAmount].replace(/[^0-9\.]/g, '') : '';
      const amount = parseFloat(rawAmount) || 0;
      const goal = idxGoal !== -1 && cols[idxGoal] ? cols[idxGoal] : 'Savings Goal';
      const month = idxMonth !== -1 && cols[idxMonth] ? cols[idxMonth] : 'February';
      const year = idxYear !== -1 ? parseInt(cols[idxYear], 10) || 2026 : 2026;
      const statusStr = idxStatus !== -1 && cols[idxStatus] ? cols[idxStatus] : 'ACTIVE';

      if (email || memberId || name) {
        users.push({
          invitationId: memberId || undefined,
          name: name || (email ? email.split('@')[0] : 'Member'),
          email: email,
          phone: phone,
          role: role.toUpperCase().includes('ADMIN') ? 'ADMIN' : 'MEMBER',
          isActive: true
        });
      }

      if (amount > 0 || recordId) {
        commitments.push({
          id: recordId || undefined,
          memberEmail: email,
          memberId: memberId,
          memberName: name,
          amount: amount || 250,
          goal: goal,
          collectionMonth: month,
          collectionYear: year,
          status: statusStr.toUpperCase().includes('COMPLET') ? 'COMPLETED' : (statusStr.toUpperCase().includes('CANCEL') ? 'CANCELLED' : 'ACTIVE')
        });
      }
    }

    return { users, commitments };
  };

  useEffect(() => {
    if (tabParam === 'security' || tabParam === 'commitment' || tabParam === 'email-templates' || tabParam === 'migration') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Inner Manage Commitment tab state: 'collection_month' | 'notifications' | 'saving_goals' | 'commitment_amounts'
  const [commitmentTab, setCommitmentTab] = useState<'collection_month' | 'notifications' | 'saving_goals' | 'commitment_amounts'>('collection_month');

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Top Banner Content States
  const [membershipAgreement, setMembershipAgreement] = useState('');
  const [feeSchedule, setFeeSchedule] = useState('');

  // Modals for Top Banner
  const [activeTopModal, setActiveTopModal] = useState<'NONE' | 'AGREEMENT' | 'FEE_SCHEDULE' | 'REVIEWS'>('NONE');

  // 1. Security Questions State
  const [securityQuestions, setSecurityQuestions] = useState<string[]>([]);
  const [newSecurityQuestion, setNewSecurityQuestion] = useState('');

  // 2. Collection Month Configuration per Amount State
  const ALL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [selectedCollectionAmount, setSelectedCollectionAmount] = useState('250.00');
  const [collectionMonthsMap, setCollectionMonthsMap] = useState<Record<string, string[]>>({});

  // 3. Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnInvite: true,
    emailOnPayment: true,
    emailOnPayout: true,
    emailOnReminder: true
  });

  // 4. Goals & Amounts
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [amounts, setAmounts] = useState<CommitmentAmount[]>([]);
  const [newAmount, setNewAmount] = useState('');
  const [newGoal, setNewGoal] = useState('');

  // 5. Email Templates State
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [activeEmailModal, setActiveEmailModal] = useState<'NONE' | 'VIEW' | 'EDIT'>('NONE');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editReminderHours, setEditReminderHours] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.savingGoals || []);
        setAmounts(data.commitmentAmounts || []);
        setMembershipAgreement(data.membershipAgreement || '');
        setFeeSchedule(data.feeSchedule || '');
        setSecurityQuestions(data.securityQuestions || []);
        setCollectionMonthsMap(data.collectionMonthsMap || {});
        if (data.notificationSettings) {
          setNotificationSettings(data.notificationSettings);
        }
        if (data.emailTemplates && data.emailTemplates.length > 0) {
          setEmailTemplates(data.emailTemplates);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings Endpoint Helper
  const handleSaveSettingKey = async (key: string, value: any, label: string) => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        setSuccessMsg(`${label} saved successfully.`);
      } else {
        await dialog.alert('Save Failed', `Failed to save ${label}.`);
      }
    } catch (err) {
      console.error('Save setting error:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- Security Questions Handlers ---
  const handleAddSecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const q = newSecurityQuestion.trim();
    if (!q) return;
    if (securityQuestions.includes(q)) {
      dialog.alert('Duplicate Question', 'This security question already exists.');
      return;
    }
    const updated = [...securityQuestions, q];
    setSecurityQuestions(updated);
    setNewSecurityQuestion('');
    handleSaveSettingKey('securityQuestions', updated, 'Security Questions');
  };

  const handleDeleteSecurityQuestion = async (index: number) => {
    if (!(await dialog.confirm('Delete Question', 'Are you sure you want to remove this security question?'))) return;
    const updated = securityQuestions.filter((_, i) => i !== index);
    setSecurityQuestions(updated);
    handleSaveSettingKey('securityQuestions', updated, 'Security Questions');
  };

  // --- Collection Month Handlers ---
  const isMonthEnabled = (monthName: string) => {
    const enabledMonths = collectionMonthsMap[selectedCollectionAmount] || ALL_MONTHS;
    return enabledMonths.includes(monthName);
  };

  const handleToggleCollectionMonth = (monthName: string) => {
    const currentEnabled = collectionMonthsMap[selectedCollectionAmount] || [...ALL_MONTHS];
    let updated: string[];
    if (currentEnabled.includes(monthName)) {
      updated = currentEnabled.filter((m) => m !== monthName);
    } else {
      updated = [...currentEnabled, monthName];
    }
    const newMap = { ...collectionMonthsMap, [selectedCollectionAmount]: updated };
    setCollectionMonthsMap(newMap);
  };

  const handleSaveCollectionMonths = () => {
    handleSaveSettingKey('collectionMonthsMap', collectionMonthsMap, 'Collection Month Configuration');
  };

  // --- Notification Settings Handlers ---
  const handleToggleNotification = (key: keyof typeof notificationSettings) => {
    const updated = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(updated);
  };

  const handleSaveNotificationSettings = () => {
    handleSaveSettingKey('notificationSettings', notificationSettings, 'Notification Settings');
  };

  // --- Goal Categories Handlers ---
  const handleToggleGoal = (index: number) => {
    const updated = [...goals];
    updated[index].enabled = !updated[index].enabled;
    setGoals(updated);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newGoal.trim();
    if (!val) return;
    const updated = [...goals, { name: val, enabled: true }];
    setGoals(updated);
    setNewGoal('');
    handleSaveSettingKey('savingGoals', updated, 'Saving Goals');
  };

  // --- Commitment Amounts Handlers ---
  const handleToggleAmount = (index: number) => {
    const updated = [...amounts];
    updated[index].enabled = !updated[index].enabled;
    setAmounts(updated);
    handleSaveSettingKey('commitmentAmounts', updated, 'Commitment Amounts');
  };

  const handleDeleteAmount = (index: number) => {
    const updated = amounts.filter((_, i) => i !== index);
    setAmounts(updated);
    handleSaveSettingKey('commitmentAmounts', updated, 'Commitment Amounts');
  };

  const handleAddAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (isNaN(val) || val <= 0) return;
    const updated = [...amounts, { amount: val, enabled: true }].sort((a, b) => a.amount - b.amount);
    setAmounts(updated);
    setNewAmount('');
    handleSaveSettingKey('commitmentAmounts', updated, 'Commitment Amounts');
  };

  // --- Email Templates Handlers ---
  const handleOpenViewTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl);
    setActiveEmailModal('VIEW');
    setOpenDropdownId(null);
  };

  const handleOpenEditTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
    setEditReminderHours(tpl.reminderHours || 'N/A');
    setEditEnabled(tpl.enabled !== false);
    setActiveEmailModal('EDIT');
    setOpenDropdownId(null);
  };

  const handleSaveEditTemplate = () => {
    if (!selectedTemplate) return;
    const updated = emailTemplates.map((t) => {
      if (t.id === selectedTemplate.id) {
        return {
          ...t,
          subject: editSubject,
          body: editBody,
          reminderHours: editReminderHours,
          enabled: editEnabled
        };
      }
      return t;
    });
    setEmailTemplates(updated);
    setActiveEmailModal('NONE');
    handleSaveSettingKey('emailTemplates', updated, 'Email Templates');
  };

  const filteredTemplates = emailTemplates.filter((t) => {
    const q = emailSearchQuery.toLowerCase().trim();
    return !q || t.title.toLowerCase().includes(q) || t.id.includes(q);
  });

  return (
    <div>

      {successMsg && (
        <div style={{
          backgroundColor: 'var(--status-success-bg)',
          color: 'var(--status-success)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          marginBottom: '20px'
        }}>
          {successMsg}
        </div>
      )}

      {/* SUB-TABS NAVIGATION (Security Question / Manage Commitment / Email Template) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', width: '100%' }}>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'security' ? '3px solid #2e3a4e' : '3px solid transparent',
            color: activeTab === 'security' ? '#2e3a4e' : '#64748b'
          }}
        >
          Security Question
        </button>
        <button
          onClick={() => setActiveTab('commitment')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'commitment' ? '3px solid #2e3a4e' : '3px solid transparent',
            color: activeTab === 'commitment' ? '#2e3a4e' : '#64748b'
          }}
        >
          Manage Commitment
        </button>
        <button
          onClick={() => setActiveTab('email-templates')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'email-templates' ? '3px solid #2e3a4e' : '3px solid transparent',
            color: activeTab === 'email-templates' ? '#2e3a4e' : '#64748b'
          }}
        >
          Email Template
        </button>
        <button
          onClick={() => setActiveTab('migration')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'migration' ? '3px solid #2e3a4e' : '3px solid transparent',
            color: activeTab === 'migration' ? '#2e3a4e' : '#64748b'
          }}
        >
          Data Migration
        </button>
      </div>

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Settings...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: SECURITY QUESTION */}
          {activeTab === 'security' && (
            <div className="glass-panel" style={{ padding: '28px', maxWidth: '700px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Security Questions Configuration
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' }}>
                Configure security verification questions available to users during account setup.
              </p>

              <form onSubmit={handleAddSecurityQuestion} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter new security question..."
                  value={newSecurityQuestion}
                  onChange={(e) => setNewSecurityQuestion(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, minWidth: '200px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }}
                />
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 }}>
                  <Plus size={16} />
                  <span>Add Question</span>
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {securityQuestions.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{q}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSecurityQuestion(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE COMMITMENT */}
          {activeTab === 'commitment' && (
            <div>
              {/* Inner Sub-Tabs: Collection Month | Notification Settings | Saving Commitment | Commitment Amount */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '10px', width: '100%' }}>
                <button
                  onClick={() => setCommitmentTab('collection_month')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: commitmentTab === 'collection_month' ? '#2e3a4e' : 'transparent',
                    color: commitmentTab === 'collection_month' ? '#ffffff' : '#475569'
                  }}
                >
                  Collection Month
                </button>
                <button
                  onClick={() => setCommitmentTab('notifications')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: commitmentTab === 'notifications' ? '#2e3a4e' : 'transparent',
                    color: commitmentTab === 'notifications' ? '#ffffff' : '#475569'
                  }}
                >
                  Notification Settings
                </button>
                <button
                  onClick={() => setCommitmentTab('saving_goals')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: commitmentTab === 'saving_goals' ? '#2e3a4e' : 'transparent',
                    color: commitmentTab === 'saving_goals' ? '#ffffff' : '#475569'
                  }}
                >
                  Saving Commitment
                </button>
                <button
                  onClick={() => setCommitmentTab('commitment_amounts')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: commitmentTab === 'commitment_amounts' ? '#2e3a4e' : 'transparent',
                    color: commitmentTab === 'commitment_amounts' ? '#ffffff' : '#475569'
                  }}
                >
                  Commitment Amount
                </button>
              </div>

              {/* Inner Tab 1: Collection Month Configuration per Amount */}
              {commitmentTab === 'collection_month' && (
                <div className="glass-panel" style={{ padding: '20px', maxWidth: '700px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ flex: '1 1 180px', maxWidth: '100%' }}>
                      <select
                        value={selectedCollectionAmount}
                        onChange={(e) => setSelectedCollectionAmount(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}
                      >
                        {amounts.filter(a => a.enabled).map(a => {
                          const valStr = Number(a.amount).toFixed(2);
                          return (
                            <option key={a.amount} value={valStr}>{valStr}</option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleSaveCollectionMonths}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 }}
                      >
                        <Save size={16} />
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>
                    Collection Month Settings for £{selectedCollectionAmount}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {ALL_MONTHS.map((m) => {
                      const enabled = isMonthEnabled(m);
                      return (
                        <label key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: enabled ? '#f8fafc' : '#ffffff', cursor: 'pointer' }}>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>{m}</span>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => handleToggleCollectionMonth(m)}
                            style={{ width: '18px', height: '18px', accentColor: '#2e3a4e', cursor: 'pointer' }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inner Tab 2: Notification Settings */}
              {commitmentTab === 'notifications' && (
                <div className="glass-panel" style={{ padding: '28px', maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
                    Notification Triggers
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px' }}>
                    Configure automated email and in-app notifications.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>Member Invitation Email</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Dispatch registration invitation when a new user is created.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOnInvite}
                        onChange={() => handleToggleNotification('emailOnInvite')}
                        style={{ width: '18px', height: '18px', accentColor: '#2e3a4e' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>Payment Confirmation Email</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Send receipt email when offline payment is confirmed.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOnPayment}
                        onChange={() => handleToggleNotification('emailOnPayment')}
                        style={{ width: '18px', height: '18px', accentColor: '#2e3a4e' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>Harvest Payout Release Email</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Send notification when harvest payout is released.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOnPayout}
                        onChange={() => handleToggleNotification('emailOnPayout')}
                        style={{ width: '18px', height: '18px', accentColor: '#2e3a4e' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>Monthly Payment Reminder Email</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Send reminder emails for outstanding contribution payments.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOnReminder}
                        onChange={() => handleToggleNotification('emailOnReminder')}
                        style={{ width: '18px', height: '18px', accentColor: '#2e3a4e' }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveNotificationSettings}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving...' : 'Save Notification Settings'}</span>
                  </button>
                </div>
              )}

              {/* Inner Tab 3: Saving Goals */}
              {commitmentTab === 'saving_goals' && (
                <div className="glass-panel" style={{ padding: '28px', maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
                    Saving Goals Categories
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>
                    Manage categories available for savers to assign to their target savings cycle.
                  </p>

                  <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                      type="text"
                      placeholder="Add goal, e.g. Property Investment"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 18px' }}>
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {goals.map((g, idx) => (
                      <label key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{g.name}</span>
                        <input
                          type="checkbox"
                          checked={g.enabled}
                          onChange={() => handleToggleGoal(idx)}
                          style={{ width: '18px', height: '18px', accentColor: '#2e3a4e' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Inner Tab 4: Commitment Amounts */}
              {commitmentTab === 'commitment_amounts' && (
                <div className="glass-panel" style={{ padding: '28px', maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
                    Commitment Amount Tiers (£)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>
                    Predefined monthly commitment amounts selectable during commitment setup.
                  </p>

                  <form onSubmit={handleAddAmount} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input
                      type="number"
                      placeholder="Add custom amount, e.g. 2000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="form-input"
                      style={{ flex: 1, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 18px' }}>
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  </form>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {amounts.map((a, idx) => (
                      <div key={a.amount} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: a.enabled ? '#f0fdf4' : '#ffffff' }}>
                        <span style={{ fontWeight: 700, color: '#064e3b', fontSize: '0.9rem' }}>£{a.amount}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={a.enabled}
                            onChange={() => handleToggleAmount(idx)}
                            style={{ width: '16px', height: '16px', accentColor: '#2e3a4e', cursor: 'pointer' }}
                            title="Enable/Disable Tier"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteAmount(idx)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Delete Tier"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL TEMPLATES */}
          {activeTab === 'email-templates' && (
            <div className="glass-panel" style={{ padding: '28px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
              <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
                <input
                  type="text"
                  placeholder="Search template title or ID..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px' }}
                />
              </div>

              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>TEMPLATE ID</th>
                      <th>TITLE</th>
                      <th style={{ width: '200px' }}>REMINDER TIME (HOURS)</th>
                      <th style={{ width: '120px' }}>STATUS</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((tpl) => {
                      const isEnabled = tpl.enabled !== false;
                      return (
                        <tr key={tpl.id}>
                          <td style={{ fontWeight: 600, color: '#64748b' }}>{tpl.id}</td>
                          <td style={{ fontWeight: 600, color: '#1e293b' }}>{tpl.title}</td>
                          <td style={{ color: '#475569', fontWeight: 500 }}>{tpl.reminderHours}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: isEnabled ? '#dcfce7' : '#fef3c7',
                              color: isEnabled ? '#15803d' : '#b45309'
                            }}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', position: 'relative' }}>
                          <div style={{ display: 'inline-block', position: 'relative' }}>
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === tpl.id ? null : tpl.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openDropdownId === tpl.id && (
                              <div style={{ position: 'absolute', right: 0, top: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '150px', padding: '4px' }}>
                                <button
                                  onClick={() => handleOpenViewTemplate(tpl)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
                                >
                                  <Eye size={14} />
                                  <span>View Template</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEditTemplate(tpl)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
                                >
                                  <Edit size={14} />
                                  <span>Edit Template</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DATA MIGRATION */}
          {activeTab === 'migration' && (
            <div className="glass-panel" style={{ padding: '28px', backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '900px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Bulk Data Migration & Import Center
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
                Migrate legacy Members (with exact Member IDs like <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>M-000374</code>), Savings Commitments (<code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>SC-00222</code>), Payments, and Waiting List records from your previous website into the platform.
              </p>

              {/* Mode Switcher */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setMigrationMode('CSV')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: migrationMode === 'CSV' ? '#2e3a4e' : '#ffffff',
                    color: migrationMode === 'CSV' ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  📊 CSV / Spreadsheet Copy-Paste (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setMigrationMode('JSON')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: migrationMode === 'JSON' ? '#2e3a4e' : '#ffffff',
                    color: migrationMode === 'JSON' ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  💻 Raw JSON Payload
                </button>
              </div>

              {/* CSV MODE */}
              {migrationMode === 'CSV' && (
                <div>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                        Frontend Table / CSV Copy-Paste Guide
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sampleCsv = `Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February\nM-000375, Jane Smith, jane@example.com, 07700900011, MEMBER, 500, March`;
                          setMigrationCsvText(sampleCsv);
                        }}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Load Sample CSV
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px 0' }}>
                      Simply select and copy the user rows from your old admin website table, or upload a <strong>.csv</strong> spreadsheet file below. Header columns recognized: <code>Member ID</code>, <code>Name</code>, <code>Email</code>, <code>Phone</code>, <code>Role</code>, <code>Amount</code>, <code>Month</code>.
                    </p>
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => setMigrationCsvText(evt.target?.result as string || '');
                          reader.readAsText(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                      Paste CSV / TSV Table Rows Below:
                    </label>
                    <textarea
                      rows={9}
                      placeholder={`Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February`}
                      value={migrationCsvText}
                      onChange={(e) => setMigrationCsvText(e.target.value)}
                      style={{
                        width: '100%',
                        fontFamily: 'monospace',
                        fontSize: '0.825rem',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* JSON MODE */}
              {migrationMode === 'JSON' && (
                <div>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                        JSON Import Schema Format Template
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = {
                            users: [
                              {
                                invitationId: "M-000374",
                                name: "Iyore Ed",
                                email: "iypearlie@gmail.com",
                                phone: "07449311040",
                                role: "MEMBER",
                                isActive: true
                              }
                            ],
                            commitments: [
                              {
                                id: "SC-00222",
                                memberEmail: "iypearlie@gmail.com",
                                amount: 1000,
                                goal: "Savings Goal",
                                collectionMonth: "February",
                                collectionYear: 2027,
                                status: "ACTIVE"
                              }
                            ]
                          };
                          setMigrationJson(JSON.stringify(sample, null, 2));
                        }}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Load Sample Data
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                      Member IDs (<code style={{ color: '#0284c7' }}>invitationId</code>) and Commitment Record IDs (<code style={{ color: '#0284c7' }}>id</code>) will be preserved exactly as specified.
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                      Paste Migration Payload (JSON Format):
                    </label>
                    <textarea
                      rows={9}
                      placeholder={`{\n  "users": [\n    {\n      "invitationId": "M-000374",\n      "name": "Iyore Ed",\n      "email": "iypearlie@gmail.com",\n      "phone": "07449311040",\n      "role": "MEMBER",\n      "isActive": true\n    }\n  ]\n}`}
                      value={migrationJson}
                      onChange={(e) => setMigrationJson(e.target.value)}
                      style={{
                        width: '100%',
                        fontFamily: 'monospace',
                        fontSize: '0.825rem',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={migrationOverwrite}
                    onChange={(e) => setMigrationOverwrite(e.target.checked)}
                    style={{ accentColor: '#2e3a4e' }}
                  />
                  <span>Overwrite / Update existing records matching Email or Member ID</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button
                  type="button"
                  disabled={migrationRunning || (migrationMode === 'CSV' ? !migrationCsvText.trim() : !migrationJson.trim())}
                  onClick={async () => {
                    setMigrationRunning(true);
                    setMigrationError('');
                    setMigrationReport(null);
                    try {
                      let payload: any = {};
                      if (migrationMode === 'CSV') {
                        payload = parseCsvToPayload(migrationCsvText);
                      } else {
                        try {
                          payload = JSON.parse(migrationJson);
                        } catch (jsonErr: any) {
                          throw new Error('Invalid JSON format: ' + jsonErr.message);
                        }
                      }
                      const res = await fetch('/api/admin/migrate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, dryRun: true, overwrite: migrationOverwrite })
                      });
                      const resText = await res.text();
                      let data: any = {};
                      try {
                        data = JSON.parse(resText);
                      } catch (e) {
                        throw new Error(resText || 'Server error occurred during validation');
                      }
                      if (res.ok) {
                        setMigrationReport(data.report);
                      } else {
                        setMigrationError(data.error || 'Validation failed');
                      }
                    } catch (err: any) {
                      setMigrationError(err.message || 'Validation failed');
                    } finally {
                      setMigrationRunning(false);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontWeight: 600, borderRadius: '8px' }}
                >
                  {migrationRunning ? 'Validating...' : 'Validate Data (Dry Run)'}
                </button>

                <button
                  type="button"
                  disabled={migrationRunning || (migrationMode === 'CSV' ? !migrationCsvText.trim() : !migrationJson.trim())}
                  onClick={async () => {
                    if (!(await dialog.confirm('Confirm Data Migration', 'Are you sure you want to execute full data migration into the live database? All records will be saved.'))) return;
                    setMigrationRunning(true);
                    setMigrationError('');
                    setMigrationReport(null);
                    try {
                      let payload: any = {};
                      if (migrationMode === 'CSV') {
                        payload = parseCsvToPayload(migrationCsvText);
                      } else {
                        try {
                          payload = JSON.parse(migrationJson);
                        } catch (jsonErr: any) {
                          throw new Error('Invalid JSON format: ' + jsonErr.message);
                        }
                      }
                      const res = await fetch('/api/admin/migrate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, dryRun: false, overwrite: migrationOverwrite })
                      });
                      const resText = await res.text();
                      let data: any = {};
                      try {
                        data = JSON.parse(resText);
                      } catch (e) {
                        throw new Error(resText || 'Server error occurred during migration');
                      }
                      if (res.ok) {
                        setMigrationReport(data.report);
                      } else {
                        setMigrationError(data.error || 'Migration failed');
                      }
                    } catch (err: any) {
                      setMigrationError(err.message || 'Migration failed');
                    } finally {
                      setMigrationRunning(false);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2e3a4e', color: '#ffffff', padding: '10px 24px', fontWeight: 600, borderRadius: '8px' }}
                >
                  {migrationRunning ? 'Importing Data...' : 'Execute Full Data Migration'}
                </button>
              </div>

              {/* Error Message */}
              {migrationError && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {migrationError}
                </div>
              )}

              {/* Migration Summary Report */}
              {migrationReport && (
                <div style={{ backgroundColor: migrationReport.dryRun ? '#f0fdf4' : '#eff6ff', border: `1px solid ${migrationReport.dryRun ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: migrationReport.dryRun ? '#166534' : '#1e40af', marginBottom: '12px' }}>
                    {migrationReport.dryRun ? '🔍 Dry-Run Validation Summary (No Changes Saved)' : '🎉 Migration Execution Complete Report'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Users Processed</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.usersProcessed}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '2px' }}>+{migrationReport.usersCreated} created / {migrationReport.usersUpdated} updated</span>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Commitments Processed</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.commitmentsProcessed}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '2px' }}>+{migrationReport.commitmentsCreated} created / {migrationReport.commitmentsUpdated} updated</span>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Payments Logged</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.paymentsCreated}</strong>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Waiting List Entries</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.waitingListCreated}</strong>
                    </div>
                  </div>

                  {migrationReport.warnings.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#d97706', display: 'block', marginBottom: '4px' }}>Warnings ({migrationReport.warnings.length}):</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#92400e' }}>
                        {migrationReport.warnings.slice(0, 5).map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {migrationReport.errors.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#dc2626', display: 'block', marginBottom: '4px' }}>Errors ({migrationReport.errors.length}):</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#991b1b' }}>
                        {migrationReport.errors.map((e: string, i: number) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TOP BANNER MODALS --- */}
      {activeTopModal === 'AGREEMENT' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              Membership Agreement Content
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
              Edit the guidelines displayed to savers and site visitors.
            </p>
            <textarea
              value={membershipAgreement}
              onChange={(e) => setMembershipAgreement(e.target.value)}
              className="form-input"
              style={{ width: '100%', minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '12px' }}
            />
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  handleSaveSettingKey('membershipAgreement', membershipAgreement, 'Membership Agreement');
                  setActiveTopModal('NONE');
                }}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}
              >
                Save Changes
              </button>
              <button onClick={() => setActiveTopModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTopModal === 'FEE_SCHEDULE' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              Fee Schedule Content
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
              Edit the fee breakdown and tier schedule displayed to members.
            </p>
            <textarea
              value={feeSchedule}
              onChange={(e) => setFeeSchedule(e.target.value)}
              className="form-input"
              style={{ width: '100%', minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '12px' }}
            />
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  handleSaveSettingKey('feeSchedule', feeSchedule, 'Fee Schedule');
                  setActiveTopModal('NONE');
                }}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}
              >
                Save Changes
              </button>
              <button onClick={() => setActiveTopModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTopModal === 'REVIEWS' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '550px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              Member Reviews & Feedback
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Member satisfaction metrics and feedback log.
            </p>
            <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Overall Saver Satisfaction Rating: 5.0 / 5.0 ★★★★★</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.825rem' }}>All member reviews are verified through completed rotating collection cycles.</p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveTopModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EMAIL TEMPLATE MODALS --- */}
      {activeEmailModal === 'VIEW' && selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveEmailModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveEmailModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
              View Email Template
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Template ID: {selectedTemplate.id} — {selectedTemplate.title}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Subject Line</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{selectedTemplate.subject}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Reminder Time (Hours)</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{selectedTemplate.reminderHours}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Email Body Content</span>
                <div style={{ marginTop: '6px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedTemplate.body}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveEmailModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeEmailModal === 'EDIT' && selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveEmailModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveEmailModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>
              Edit Email Template
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Modify template content for: {selectedTemplate.title}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Subject Line *</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Reminder Time (Hours)</label>
                  <input
                    type="text"
                    value={editReminderHours}
                    onChange={(e) => setEditReminderHours(e.target.value)}
                    placeholder="e.g. 24 or N/A"
                    className="form-input"
                    style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Template Status *</label>
                  <select
                    value={editEnabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditEnabled(e.target.value === 'enabled')}
                    className="form-input"
                    style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px', fontWeight: 600 }}
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Email Body Content *</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', minHeight: '180px', fontFamily: 'sans-serif', fontSize: '0.875rem', lineHeight: 1.5, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '12px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveEditTemplate}
                disabled={saving}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
              <button onClick={() => setActiveEmailModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
        <div className="loading-spinner"></div>
        <span style={{ color: 'var(--text-muted)' }}>Loading Settings...</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
