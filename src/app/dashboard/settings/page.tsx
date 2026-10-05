'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, Plus, Save, Eye, Edit, Trash2, X, MoreVertical, FileText, Bell, ShieldCheck, Database, Upload, Check, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
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

  // Inner Manage Commitment tab state: 'overview' | 'collection_month' | 'notifications' | 'saving_goals' | 'commitment_amounts'
  const [commitmentTab, setCommitmentTab] = useState<'overview' | 'collection_month' | 'notifications' | 'saving_goals' | 'commitment_amounts'>('collection_month');

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
        setTimeout(() => setSuccessMsg(''), 4000);
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
    handleSaveSettingKey('savingGoals', updated, 'Saving Goals');
  };

  const handleDeleteGoal = async (index: number) => {
    if (!(await dialog.confirm('Delete Goal Category', `Are you sure you want to delete the goal category "${goals[index].name}"? This cannot be undone.`))) return;
    const updated = goals.filter((_, i) => i !== index);
    setGoals(updated);
    handleSaveSettingKey('savingGoals', updated, 'Saving Goals');
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
  }).sort((a, b) => parseInt(a.id) - parseInt(b.id));

  // Computed stats for Manage Commitment overview
  const enabledNotificationsCount = Object.values(notificationSettings).filter(Boolean).length;
  const configuredCollectionMonthsCount = Object.keys(collectionMonthsMap).length;

  type MainTab = 'security' | 'commitment' | 'email-templates' | 'migration';
  type CommitmentSubTab = 'overview' | 'collection_month' | 'notifications' | 'saving_goals' | 'commitment_amounts';

  const sectionTitles: Record<MainTab, string> = {
    security: 'Security Questions',
    commitment: 'Manage Commitments',
    'email-templates': 'Email Templates',
    migration: 'Data Migration',
  };

  const sectionSubtitles: Record<MainTab, string> = {
    security: 'Configure security verification questions used for administrative identity validation.',
    commitment: 'Configure rotating savings cycle rules, collection availability, notifications, and commitment amounts.',
    'email-templates': 'Customize and manage automated transactional emails sent to platform savers.',
    migration: 'Import and synchronize legacy member accounts, commitments, and historical data.',
  };

  const commitmentSubTabLabels: Record<CommitmentSubTab, string> = {
    overview: 'Overview',
    collection_month: 'Collection Month',
    notifications: 'Notification Triggers',
    saving_goals: 'Saving Goals',
    commitment_amounts: 'Commitment Tiers',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── UNIFIED PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Account Settings
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            {sectionSubtitles[activeTab as MainTab]}
          </p>
        </div>

        {/* Quick Guidelines Shortcuts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTopModal('AGREEMENT')}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #ECE8E2',
              borderRadius: '10px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} color="#6B7280" />
            <span>Agreement</span>
          </button>

          <button
            onClick={() => setActiveTopModal('FEE_SCHEDULE')}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #ECE8E2',
              borderRadius: '10px',
              padding: '8px 14px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={14} color="#6B7280" />
            <span>Fee Schedule</span>
          </button>
        </div>
      </div>

      {/* ── RESPONSIVE HORIZONTAL TAB NAVIGATION BAR ── */}
      <div className="settings-tab-bar">
        {[
          { key: 'security' as const, label: 'Security Questions', icon: ShieldCheck },
          { key: 'commitment' as const, label: 'Manage Commitments', icon: Settings },
          { key: 'email-templates' as const, label: 'Email Templates', icon: FileText },
          { key: 'migration' as const, label: 'Data Migration', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`settings-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                backgroundColor: isActive ? '#1B4332' : 'transparent',
                color: isActive ? '#FFFFFF' : '#6B7280',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(27, 67, 50, 0.2)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#FAF9F6';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={16} color={isActive ? '#FFFFFF' : '#6B7280'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div style={{
          backgroundColor: '#EAF5EE',
          color: '#1B4332',
          border: '1px solid #D5E5DB',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <CheckCircle2 size={18} color="#2E7D32" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Settings...</span>
        </div>
      ) : (
        <>
          {/* ─────────────────────────────── TAB 1: SECURITY QUESTION ─────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="settings-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
              {/* Main Card: Add & List Security Questions */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                    Security Questions Setup
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                    Admins and members are verified with these questions to authenticate identity when signing in from new devices or confirming payout adjustments.
                  </p>
                </div>

                {/* Add New Question Form */}
                <form onSubmit={handleAddSecurityQuestion} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Enter new security question, e.g. What was your childhood nickname?"
                    value={newSecurityQuestion}
                    onChange={(e) => setNewSecurityQuestion(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      backgroundColor: '#FAF9F6',
                      border: '1px solid #ECE8E2',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      color: '#111827',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#1B4332',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontWeight: 600,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0c4e43'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B4332'}
                  >
                    <Plus size={15} />
                    <span>Add Question</span>
                  </button>
                </form>

                {/* Questions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Security Questions ({securityQuestions.length})
                  </div>

                  {securityQuestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '0.88rem', border: '1px dashed #ECE8E2', borderRadius: '12px', backgroundColor: '#FAF9F6' }}>
                      No security questions configured yet. Add your first question above.
                    </div>
                  ) : (
                    securityQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 18px',
                          backgroundColor: '#FAF9F6',
                          border: '1px solid #ECE8E2',
                          borderRadius: '12px',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#0c4e43', backgroundColor: '#EAF5EE', padding: '2px 8px', borderRadius: '6px' }}>
                            Q{idx + 1}
                          </span>
                          <span style={{ fontSize: '0.88rem', color: '#111827', fontWeight: 500 }}>
                            {q}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSecurityQuestion(idx)}
                          aria-label="Delete question"
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Side Info Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>Why this matters</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                    Security verification questions provide a resilient 2-factor barrier safeguarding member savings schedules and preventing unauthorized withdrawals.
                  </p>
                </div>

                <div style={{ backgroundColor: '#FAF9F6', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={16} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>Recovery Protocol</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>
                    If a member forgets their security answers, identity recovery mandates manual administrative confirmation with government photo ID.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────── TAB 2: MANAGE COMMITMENTS ─────────────────────────────── */}
          {activeTab === 'commitment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 4-KPI Overview Cards (Screenshot & Theme Matching) */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                      Commitment Configuration Overview
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                      Real-time status of savings circles, tier rules, and monthly payout constraints.
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: '#EAF5EE',
                    color: '#2E7D32',
                    border: '1px solid #D5E5DB',
                    borderRadius: '20px',
                    padding: '4px 12px'
                  }}>
                    ✓ {[goals.length > 0, amounts.length > 0, configuredCollectionMonthsCount > 0, enabledNotificationsCount > 0].filter(Boolean).length} / 4 Configured
                  </span>
                </div>

                <div className="settings-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {[
                    { icon: '📁', count: goals.length, label: 'Goal Categories', sub: 'saving_goals' as CommitmentSubTab },
                    { icon: '£', count: amounts.length, label: 'Amount Tiers', sub: 'commitment_amounts' as CommitmentSubTab },
                    { icon: '📅', count: configuredCollectionMonthsCount > 0 ? 12 : 0, label: 'Collection Months', sub: 'collection_month' as CommitmentSubTab },
                    { icon: '🔔', count: enabledNotificationsCount, label: 'Notification Rules', sub: 'notifications' as CommitmentSubTab },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        padding: '18px',
                        borderRadius: '12px',
                        border: '1px solid #ECE8E2',
                        backgroundColor: '#FAF9F6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280' }}>{stat.label}</span>
                        <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                        {stat.count}
                      </div>
                      <button
                        onClick={() => setCommitmentTab(stat.sub)}
                        style={{
                          marginTop: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#0c4e43',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left'
                        }}
                      >
                        Configure {stat.label} →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="settings-subtab-bar">
                {(['collection_month', 'notifications', 'saving_goals', 'commitment_amounts'] as CommitmentSubTab[]).map((sub) => {
                  const isActive = commitmentTab === sub;
                  return (
                    <button
                      key={sub}
                      id={`commitment-subtab-${sub}`}
                      onClick={() => setCommitmentTab(sub)}
                      style={{
                        padding: '9px 18px',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.84rem',
                        border: isActive ? '1px solid #D5E5DB' : 'none',
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? '#0c4e43' : '#6B7280',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {commitmentSubTabLabels[sub]}
                    </button>
                  );
                })}
              </div>

              {/* Sub-Tab Panels */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '24px' }}>
                {/* 1. Collection Month Settings */}
                {commitmentTab === 'collection_month' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                          Collection Month Availability
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                          Control which harvest months are available for selection when savers choose specific monthly contribution tiers.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                          value={selectedCollectionAmount}
                          onChange={(e) => setSelectedCollectionAmount(e.target.value)}
                          style={{
                            backgroundColor: '#FAF9F6',
                            border: '1px solid #ECE8E2',
                            borderRadius: '10px',
                            padding: '9px 14px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: '#111827',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {amounts.filter(a => a.enabled).map(a => {
                            const valStr = Number(a.amount).toFixed(2);
                            return <option key={a.amount} value={valStr}>Monthly Tier: £{valStr}</option>;
                          })}
                        </select>

                        <button
                          type="button"
                          onClick={handleSaveCollectionMonths}
                          disabled={saving}
                          style={{
                            backgroundColor: '#1B4332',
                            color: '#FFFFFF',
                            borderRadius: '10px',
                            border: 'none',
                            padding: '9px 18px',
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Save size={15} />
                          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                        Month Selection for £{selectedCollectionAmount}
                      </span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const newMap = { ...collectionMonthsMap, [selectedCollectionAmount]: [...ALL_MONTHS] };
                            setCollectionMonthsMap(newMap);
                          }}
                          style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#0c4e43', cursor: 'pointer' }}
                        >
                          Select All
                        </button>
                        <span style={{ color: '#ECE8E2' }}>|</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMap = { ...collectionMonthsMap, [selectedCollectionAmount]: [] };
                            setCollectionMonthsMap(newMap);
                          }}
                          style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Months Checkbox Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {ALL_MONTHS.map((m) => {
                        const enabled = isMonthEnabled(m);
                        return (
                          <label
                            key={m}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 16px',
                              borderRadius: '12px',
                              border: '1px solid',
                              borderColor: enabled ? '#D5E5DB' : '#ECE8E2',
                              backgroundColor: enabled ? '#FAF9F6' : '#FFFFFF',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontWeight: 600, color: enabled ? '#111827' : '#6B7280', fontSize: '0.88rem' }}>
                              {m}
                            </span>
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => handleToggleCollectionMonth(m)}
                              style={{ width: '18px', height: '18px', accentColor: '#0c4e43', cursor: 'pointer' }}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Notification Triggers Settings */}
                {commitmentTab === 'notifications' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                          Automated Notification Triggers
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                          Toggle automatic transactional emails and SMS notifications sent when key savings milestones occur.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#EAF5EE', border: '1px solid #D5E5DB', borderRadius: '8px', padding: '6px 12px' }}>
                        <span style={{ color: '#2E7D32', fontWeight: 700, fontSize: '0.78rem' }}>✓ Notifications Dispatch Active</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { key: 'emailOnInvite' as const, label: 'Member Invitation Email', desc: 'Dispatch registration invitation and circle invite link when a new saver is enrolled.', icon: '👤' },
                        { key: 'emailOnPayment' as const, label: 'Payment Confirmation Email', desc: 'Send receipt confirmation email when offline/online contribution is verified.', icon: '💳' },
                        { key: 'emailOnPayout' as const, label: 'Harvest Payout Release Email', desc: 'Send congratulatory release notification when harvest disbursement is completed.', icon: '🎁' },
                        { key: 'emailOnReminder' as const, label: 'Monthly Payment Reminder Email', desc: 'Send automated reminders for scheduled monthly contribution dues.', icon: '✉️' },
                      ].map(({ key, label, desc, icon }) => (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            border: '1px solid #ECE8E2',
                            backgroundColor: notificationSettings[key] ? '#FAF9F6' : '#FFFFFF',
                            cursor: 'pointer',
                            gap: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EAF5EE', color: '#0c4e43', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                              {icon}
                            </div>
                            <div>
                              <span style={{ fontWeight: 700, color: '#111827', display: 'block', fontSize: '0.9rem' }}>{label}</span>
                              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{desc}</span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings[key]}
                            onChange={() => handleToggleNotification(key)}
                            style={{ width: '18px', height: '18px', accentColor: '#0c4e43', flexShrink: 0, cursor: 'pointer' }}
                          />
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <button
                        type="button"
                        onClick={handleSaveNotificationSettings}
                        disabled={saving}
                        style={{
                          backgroundColor: '#1B4332',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          border: 'none',
                          padding: '10px 24px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={15} />
                        <span>{saving ? 'Saving...' : 'Save Notification Settings'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Saving Goals Categories */}
                {commitmentTab === 'saving_goals' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                        Saving Goal Categories
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                        Manage predefined savings targets available for savers to categorize their personal milestones.
                      </p>
                    </div>

                    <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Add new goal, e.g. Property Deposit or Business Capital"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '220px',
                          backgroundColor: '#FAF9F6',
                          border: '1px solid #ECE8E2',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          color: '#111827',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#1B4332',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 18px',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Plus size={15} />
                        <span>Add Category</span>
                      </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {goals.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '0.88rem', border: '1px dashed #ECE8E2', borderRadius: '12px', backgroundColor: '#FAF9F6' }}>
                          No saving goal categories configured yet. Add your first above.
                        </div>
                      ) : (
                        goals.map((g, idx) => (
                          <div
                            key={g.name + idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 18px',
                              borderRadius: '12px',
                              border: '1px solid #ECE8E2',
                              backgroundColor: '#FAF9F6'
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={g.enabled}
                                onChange={() => handleToggleGoal(idx)}
                                style={{ width: '18px', height: '18px', accentColor: '#0c4e43', flexShrink: 0 }}
                              />
                              <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                                {g.name}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(idx)}
                              aria-label="Delete goal category"
                              style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Commitment Amounts */}
                {commitmentTab === 'commitment_amounts' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                        Monthly Commitment Amount Tiers (£)
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                        Configured monthly contribution sums available to members during circle onboarding.
                      </p>
                    </div>

                    <form onSubmit={handleAddAmount} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        placeholder="Add custom monthly amount, e.g. 500"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '220px',
                          backgroundColor: '#FAF9F6',
                          border: '1px solid #ECE8E2',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          color: '#111827',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#1B4332',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 18px',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Plus size={15} />
                        <span>Add Tier</span>
                      </button>
                    </form>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                      {amounts.map((a, idx) => (
                        <div
                          key={a.amount}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderRadius: '12px',
                            border: '1px solid #ECE8E2',
                            backgroundColor: '#FAF9F6'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem', fontFamily: 'var(--font-family-title)' }}>
                              £{Number(a.amount).toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#6B7280', display: 'block' }}>per month</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={a.enabled}
                                onChange={() => handleToggleAmount(idx)}
                                style={{ width: '16px', height: '16px', accentColor: '#0c4e43', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.75rem', color: a.enabled ? '#2E7D32' : '#B45309', fontWeight: 600 }}>
                                {a.enabled ? 'Active' : 'Off'}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteAmount(idx)}
                              aria-label="Delete amount"
                              style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
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
            </div>
          )}

          {/* ─────────────────────────────── TAB 3: EMAIL TEMPLATES ─────────────────────────────── */}
          {activeTab === 'email-templates' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                    Email Notification Templates
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                    Manage customizable transactional copy and reminder schedules dispatched to savers.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Search templates by title or ID..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: '#FAF9F6',
                    border: '1px solid #ECE8E2',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    width: '260px',
                    fontSize: '0.84rem',
                    color: '#111827',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="table-container" style={{ border: '1px solid #ECE8E2', borderRadius: '12px', overflow: 'hidden' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        TEMPLATE TITLE &amp; TIMING
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        CATEGORY
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        TEMPLATE ID
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        STATUS
                      </th>
                      <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((tpl) => {
                      const isEnabled = tpl.enabled !== false;
                      return (
                        <tr key={tpl.id} style={{ borderBottom: '1px solid #ECE8E2' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>{tpl.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                              {tpl.reminderHours !== 'N/A' ? `Triggered ${tpl.reminderHours}h after due date.` : 'Triggered on event.'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: '#EAF5EE',
                              color: '#0c4e43'
                            }}>
                              {tpl.reminderHours !== 'N/A' ? 'Reminder' : 'System'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {tpl.id}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: isEnabled ? '#EAF5EE' : '#FEF3C7',
                              color: isEnabled ? '#2E7D32' : '#B45309'
                            }}>
                              {isEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenViewTemplate(tpl)}
                                style={{ background: 'none', border: '1px solid #ECE8E2', cursor: 'pointer', padding: '6px 8px', color: '#374151', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                                title="View Template"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEditTemplate(tpl)}
                                style={{ background: 'none', border: '1px solid #ECE8E2', cursor: 'pointer', padding: '6px 8px', color: '#374151', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                                title="Edit Template"
                              >
                                <Edit size={14} />
                              </button>
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

          {/* ─────────────────────────────── TAB 4: DATA MIGRATION ─────────────────────────────── */}
          {activeTab === 'migration' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                  Bulk Data Migration &amp; Legacy Import Center
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '4px', margin: 0 }}>
                  Synchronize legacy members (with IDs like <code style={{ backgroundColor: '#EAF5EE', padding: '2px 6px', borderRadius: '4px', color: '#0c4e43' }}>M-000374</code>), Savings Commitments (<code style={{ backgroundColor: '#EAF5EE', padding: '2px 6px', borderRadius: '4px', color: '#0c4e43' }}>SC-00222</code>), and waitlist records.
                </p>
              </div>

              {/* Mode Switcher */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMigrationMode('CSV')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    border: '1px solid',
                    borderColor: migrationMode === 'CSV' ? '#1B4332' : '#ECE8E2',
                    backgroundColor: migrationMode === 'CSV' ? '#1B4332' : '#FAF9F6',
                    color: migrationMode === 'CSV' ? '#FFFFFF' : '#374151',
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
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    border: '1px solid',
                    borderColor: migrationMode === 'JSON' ? '#1B4332' : '#ECE8E2',
                    backgroundColor: migrationMode === 'JSON' ? '#1B4332' : '#FAF9F6',
                    color: migrationMode === 'JSON' ? '#FFFFFF' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  💻 Raw JSON Payload
                </button>
              </div>

              {/* CSV MODE */}
              {migrationMode === 'CSV' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>CSV Copy-Paste / Upload Instructions</span>
                      <button
                        type="button"
                        onClick={() => {
                          const sampleCsv = `Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February\nM-000375, Jane Smith, jane@example.com, 07700900011, MEMBER, 500, March`;
                          setMigrationCsvText(sampleCsv);
                        }}
                        style={{ background: 'none', border: 'none', color: '#0c4e43', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Load Sample CSV
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 10px 0' }}>
                      Select and paste rows directly from your previous spreadsheet or upload a <strong>.csv</strong> file. Recognized columns: <code>Member ID</code>, <code>Name</code>, <code>Email</code>, <code>Phone</code>, <code>Role</code>, <code>Amount</code>, <code>Month</code>.
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                      Paste CSV / TSV Rows Below:
                    </label>
                    <textarea
                      rows={8}
                      placeholder={`Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February`}
                      value={migrationCsvText}
                      onChange={(e) => setMigrationCsvText(e.target.value)}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem', padding: '12px', borderRadius: '10px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#111827', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* JSON MODE */}
              {migrationMode === 'JSON' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>JSON Payload Template</span>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = {
                            users: [{ invitationId: "M-000374", name: "Iyore Ed", email: "iypearlie@gmail.com", phone: "07449311040", role: "MEMBER", isActive: true }],
                            commitments: [{ id: "SC-00222", memberEmail: "iypearlie@gmail.com", amount: 1000, goal: "Savings Goal", collectionMonth: "February", collectionYear: 2027, status: "ACTIVE" }]
                          };
                          setMigrationJson(JSON.stringify(sample, null, 2));
                        }}
                        style={{ background: 'none', border: 'none', color: '#0c4e43', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Load Sample Data
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                      Member IDs (<code style={{ color: '#0c4e43' }}>invitationId</code>) and Commitment Record IDs (<code style={{ color: '#0c4e43' }}>id</code>) are saved exactly as specified.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                      Paste Migration Payload (JSON Format):
                    </label>
                    <textarea
                      rows={8}
                      placeholder={`{\n  "users": [\n    {\n      "invitationId": "M-000374",\n      "name": "Iyore Ed",\n      "email": "iypearlie@gmail.com",\n      "phone": "07449311040",\n      "role": "MEMBER",\n      "isActive": true\n    }\n  ]\n}`}
                      value={migrationJson}
                      onChange={(e) => setMigrationJson(e.target.value)}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem', padding: '12px', borderRadius: '10px', border: '1px solid #ECE8E2', backgroundColor: '#FAF9F6', color: '#111827', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* Overwrite Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#111827', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={migrationOverwrite}
                  onChange={(e) => setMigrationOverwrite(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0c4e43' }}
                />
                <span>Overwrite / update existing records matching Email or Member ID</span>
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                      try { data = JSON.parse(resText); } catch (e) { throw new Error(resText || 'Server error occurred during validation'); }
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
                  style={{
                    backgroundColor: '#FAF9F6',
                    color: '#374151',
                    border: '1px solid #ECE8E2',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
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
                      try { data = JSON.parse(resText); } catch (e) { throw new Error(resText || 'Server error occurred during migration'); }
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
                  style={{
                    backgroundColor: '#1B4332',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {migrationRunning ? 'Importing Data...' : 'Execute Full Data Migration'}
                </button>
              </div>

              {migrationError && (
                <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {migrationError}
                </div>
              )}

              {migrationReport && (
                <div style={{ backgroundColor: migrationReport.dryRun ? '#EAF5EE' : '#F0F9FF', border: `1px solid ${migrationReport.dryRun ? '#D5E5DB' : '#BAE6FD'}`, borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: migrationReport.dryRun ? '#166534' : '#0369A1', margin: '0 0 12px 0' }}>
                    {migrationReport.dryRun ? '🔍 Dry-Run Validation Summary (No Changes Saved)' : '🎉 Migration Execution Complete Report'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #ECE8E2' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280', display: 'block' }}>Users Processed</span>
                      <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{migrationReport.usersProcessed}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#2E7D32', display: 'block', marginTop: '2px' }}>+{migrationReport.usersCreated} created / {migrationReport.usersUpdated} updated</span>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #ECE8E2' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280', display: 'block' }}>Commitments Processed</span>
                      <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{migrationReport.commitmentsProcessed}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#2E7D32', display: 'block', marginTop: '2px' }}>+{migrationReport.commitmentsCreated} created / {migrationReport.commitmentsUpdated} updated</span>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #ECE8E2' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280', display: 'block' }}>Payments Logged</span>
                      <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{migrationReport.paymentsCreated}</strong>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #ECE8E2' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280', display: 'block' }}>Waiting List Entries</span>
                      <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{migrationReport.waitingListCreated}</strong>
                    </div>
                  </div>
                  {migrationReport.warnings.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong style={{ fontSize: '0.8rem', color: '#B45309', display: 'block', marginBottom: '4px' }}>Warnings ({migrationReport.warnings.length}):</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#92400E' }}>
                        {migrationReport.warnings.slice(0, 5).map((w: string, i: number) => (<li key={i}>{w}</li>))}
                      </ul>
                    </div>
                  )}
                  {migrationReport.errors.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#DC2626', display: 'block', marginBottom: '4px' }}>Errors ({migrationReport.errors.length}):</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#991B1B' }}>
                        {migrationReport.errors.map((e: string, i: number) => (<li key={i}>{e}</li>))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── MODALS (Unified Design) ── */}

      {/* 1. Membership Agreement Modal */}
      {activeTopModal === 'AGREEMENT' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #ECE8E2' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: '#111827', fontFamily: 'var(--font-family-title)' }}>Membership Agreement Content</h3>
            <p style={{ color: '#6B7280', fontSize: '0.82rem', marginBottom: '16px' }}>Edit the guidelines displayed to savers and site visitors during registration.</p>
            <textarea
              value={membershipAgreement}
              onChange={(e) => setMembershipAgreement(e.target.value)}
              style={{ width: '100%', minHeight: '240px', fontFamily: 'monospace', fontSize: '0.84rem', lineHeight: 1.5, backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '12px', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveTopModal('NONE')} style={{ backgroundColor: '#FAF9F6', color: '#374151', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '9px 18px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { handleSaveSettingKey('membershipAgreement', membershipAgreement, 'Membership Agreement'); setActiveTopModal('NONE'); }} style={{ backgroundColor: '#1B4332', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 20px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fee Schedule Modal */}
      {activeTopModal === 'FEE_SCHEDULE' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #ECE8E2' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: '#111827', fontFamily: 'var(--font-family-title)' }}>Fee Schedule Content</h3>
            <p style={{ color: '#6B7280', fontSize: '0.82rem', marginBottom: '16px' }}>Edit the annual administrative fee breakdown and tier schedule displayed to members.</p>
            <textarea
              value={feeSchedule}
              onChange={(e) => setFeeSchedule(e.target.value)}
              style={{ width: '100%', minHeight: '240px', fontFamily: 'monospace', fontSize: '0.84rem', lineHeight: 1.5, backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '12px', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveTopModal('NONE')} style={{ backgroundColor: '#FAF9F6', color: '#374151', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '9px 18px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { handleSaveSettingKey('feeSchedule', feeSchedule, 'Fee Schedule'); setActiveTopModal('NONE'); }} style={{ backgroundColor: '#1B4332', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 20px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. View Email Template Modal */}
      {activeEmailModal === 'VIEW' && selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveEmailModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #ECE8E2' }}>
            <button onClick={() => setActiveEmailModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px', color: '#111827', fontFamily: 'var(--font-family-title)' }}>View Email Template</h3>
            <p style={{ color: '#6B7280', fontSize: '0.82rem', marginBottom: '20px' }}>Template ID: {selectedTemplate.id} — {selectedTemplate.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Subject Line</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{selectedTemplate.subject}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Reminder Timing</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{selectedTemplate.reminderHours} hours</p>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Email Body Content</span>
                <div style={{ marginTop: '6px', padding: '16px', backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', fontSize: '0.85rem', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedTemplate.body}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveEmailModal('NONE')} style={{ backgroundColor: '#FAF9F6', color: '#374151', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '9px 20px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Email Template Modal */}
      {activeEmailModal === 'EDIT' && selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveEmailModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #ECE8E2' }}>
            <button onClick={() => setActiveEmailModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px', color: '#111827', fontFamily: 'var(--font-family-title)' }}>Edit Email Template</h3>
            <p style={{ color: '#6B7280', fontSize: '0.82rem', marginBottom: '20px' }}>Modify template content for: {selectedTemplate.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', fontSize: '0.84rem', marginBottom: '6px' }}>Subject Line *</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', color: '#111827', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#374151', fontSize: '0.84rem', marginBottom: '6px' }}>Reminder Hours</label>
                  <input
                    type="text"
                    value={editReminderHours}
                    onChange={(e) => setEditReminderHours(e.target.value)}
                    placeholder="e.g. 24 or N/A"
                    style={{ width: '100%', backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', color: '#111827', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#374151', fontSize: '0.84rem', marginBottom: '6px' }}>Template Status *</label>
                  <select
                    value={editEnabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditEnabled(e.target.value === 'enabled')}
                    style={{ width: '100%', backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#111827', boxSizing: 'border-box' }}
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', fontSize: '0.84rem', marginBottom: '6px' }}>Email Body Content *</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  style={{ width: '100%', minHeight: '160px', fontFamily: 'sans-serif', fontSize: '0.85rem', lineHeight: 1.5, backgroundColor: '#FAF9F6', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveEmailModal('NONE')} style={{ backgroundColor: '#FAF9F6', color: '#374151', border: '1px solid #ECE8E2', borderRadius: '10px', padding: '9px 18px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSaveEditTemplate} disabled={saving} style={{ backgroundColor: '#1B4332', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '9px 22px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Template'}
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
