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

  // Section metadata for the left nav
  type MainTab = 'security' | 'commitment' | 'email-templates' | 'migration';
  type CommitmentSubTab = 'overview' | 'collection_month' | 'notifications' | 'saving_goals' | 'commitment_amounts';

  const sectionTitles: Record<MainTab, string> = {
    security: 'Security Question',
    commitment: 'Manage Commitment',
    'email-templates': 'Email Template',
    migration: 'Data Migration',
  };

  const sectionSubtitles: Record<MainTab, string> = {
    security: 'Set the security questions that will be used to verify identity.',
    commitment: 'Configure how savings commitments work on the platform.',
    'email-templates': 'Create and manage email templates used for member communications.',
    migration: 'Migrate legacy data records into the platform.',
  };

  const commitmentSubTabLabels: Record<CommitmentSubTab, string> = {
    overview: 'Overview',
    collection_month: 'Collection Month',
    notifications: 'Notification Settings',
    saving_goals: 'Saving Commitment',
    commitment_amounts: 'Commitment Amount',
  };

  // Nav icon colours
  const navItemBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', borderRadius: '8px',
    fontSize: '0.875rem', fontWeight: 500,
    cursor: 'pointer', border: 'none', background: 'none',
    width: '100%', textAlign: 'left', textDecoration: 'none',
    transition: 'background 0.15s ease',
    color: '#334155',
  };
  const navItemActive: React.CSSProperties = {
    ...navItemBase,
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    fontWeight: 600,
  };
  const subNavItemBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '7px 12px 7px 36px',
    borderRadius: '6px',
    fontSize: '0.825rem', fontWeight: 500,
    cursor: 'pointer', border: 'none', background: 'none',
    width: '100%', textAlign: 'left',
    transition: 'background 0.15s ease',
    color: '#64748b',
  };
  const subNavItemActive: React.CSSProperties = {
    ...subNavItemBase,
    color: '#c27a3a',
    fontWeight: 600,
  };

  const isCommitmentOpen = activeTab === 'commitment';

  return (
    <div style={{ display: 'flex', gap: '0', minHeight: 'calc(100vh - 102px)', margin: '-32px', overflow: 'hidden' }}>

      {/* ── LEFT SETTINGS NAV ── */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#94a3b8', padding: '0 12px 10px 12px' }}>
          Settings
        </div>

        {/* Security Question */}
        <button
          id="settings-nav-security"
          onClick={() => setActiveTab('security')}
          style={activeTab === 'security' ? navItemActive : navItemBase}
        >
          <span style={{ fontSize: '1rem' }}>🛡</span>
          <span>Security Question</span>
        </button>

        {/* Manage Commitment (expandable) */}
        <button
          id="settings-nav-commitment"
          onClick={() => { setActiveTab('commitment'); setCommitmentTab('saving_goals'); }}
          style={isCommitmentOpen ? navItemActive : navItemBase}
        >
          <span style={{ fontSize: '1rem' }}>👥</span>
          <span style={{ flex: 1 }}>Manage Commitment</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{isCommitmentOpen ? '▾' : '▸'}</span>
        </button>

        {/* Sub-nav items for Manage Commitment */}
        {isCommitmentOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
            {(['overview', 'saving_goals', 'commitment_amounts', 'collection_month', 'notifications'] as CommitmentSubTab[]).map((sub) => (
              <button
                key={sub}
                id={`settings-nav-commitment-${sub}`}
                onClick={() => setCommitmentTab(sub)}
                style={commitmentTab === sub ? subNavItemActive : subNavItemBase}
              >
                {commitmentTab === sub && <span style={{ color: '#c27a3a', fontSize: '0.5rem' }}>●</span>}
                {commitmentTab !== sub && <span style={{ width: '8px' }} />}
                {commitmentSubTabLabels[sub]}
              </button>
            ))}
          </div>
        )}

        {/* Email Template */}
        <button
          id="settings-nav-email-templates"
          onClick={() => setActiveTab('email-templates')}
          style={activeTab === 'email-templates' ? navItemActive : navItemBase}
        >
          <span style={{ fontSize: '1rem' }}>✉️</span>
          <span>Email Template</span>
        </button>

        {/* Data Migration */}
        <button
          id="settings-nav-migration"
          onClick={() => setActiveTab('migration')}
          style={activeTab === 'migration' ? navItemActive : navItemBase}
        >
          <span style={{ fontSize: '1rem' }}>🗄</span>
          <span>Data Migration</span>
        </button>

        {/* Help card */}
        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <div style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Need help?</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4, marginBottom: '8px' }}>Learn how each setting works.</div>
            <a
              href="mailto:support@savveysavers.com"
              style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c27a3a', textDecoration: 'none' }}
            >
              View Help Guide ↗
            </a>
          </div>
        </div>
      </aside>

      {/* ── RIGHT CONTENT AREA ── */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#f8fafc', minWidth: 0 }}>

        {/* Page heading */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {sectionTitles[activeTab as MainTab] || 'Settings'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            {sectionSubtitles[activeTab as MainTab]}
          </p>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div style={{
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>✓</span> {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '16px' }}>
            <div className="loading-spinner" />
            <span style={{ color: '#64748b' }}>Loading Settings...</span>
          </div>
        ) : (
          <>
            {/* ─────────────────────────────── TAB 1: SECURITY QUESTION ─────────────────────────────── */}
            {activeTab === 'security' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                  {/* Main card */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Security Question Setup</h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px' }}>
                      Admins will be asked this question to confirm their identity when logging in from unrecognised devices or when sensitive actions are taken.
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Security Question</label>
                      <form onSubmit={handleAddSecurityQuestion} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Enter new security question..."
                          value={newSecurityQuestion}
                          onChange={(e) => setNewSecurityQuestion(e.target.value)}
                          className="form-input"
                          style={{ flex: 1, minWidth: '200px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '8px' }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Plus size={15} />
                          <span>Add Question</span>
                        </button>
                      </form>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                      {securityQuestions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.875rem', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                          No security questions configured yet.
                        </div>
                      )}
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

                  {/* Info sidebar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ color: '#16a34a', fontSize: '1.1rem' }}>✔</span>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534' }}>Why this matters</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                        Your security question adds an extra layer of protection to your account and helps us verify your identity quickly when needed.
                      </p>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🔒</span>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Important</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                        If you forget the answer, account recovery will require administrator verification. Make sure the answer is something you can always remember.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recently Updated footer */}
                <div style={{ marginTop: '28px', padding: '14px 18px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>🕐</span>
                    <span><strong>Recently Updated</strong> — Security questions configuration</span>
                  </div>
                  <button style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#c27a3a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Audit Log →
                  </button>
                </div>
              </>
            )}

            {/* ─────────────────────────────── TAB 2: MANAGE COMMITMENT ─────────────────────────────── */}
            {activeTab === 'commitment' && (
              <>
                {/* Overview stats card (always shown) */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px 26px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Manage Commitment Overview</h2>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>Quick overview of your commitment settings.</p>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '4px 12px' }}>
                      ✓ {[goals.length > 0, amounts.length > 0, configuredCollectionMonthsCount > 0, enabledNotificationsCount > 0].filter(Boolean).length} / 4 Configured
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[
                      { icon: '📁', count: goals.length, label: 'Goal Categories', sub: 'saving_goals' as CommitmentSubTab },
                      { icon: '£', count: amounts.length, label: 'Amount Tiers', sub: 'commitment_amounts' as CommitmentSubTab },
                      { icon: '📅', count: configuredCollectionMonthsCount > 0 ? 12 : 0, label: 'Collection Months', sub: 'collection_month' as CommitmentSubTab },
                      { icon: '🔔', count: enabledNotificationsCount, label: 'Notifications On', sub: 'notifications' as CommitmentSubTab },
                    ].map((stat) => (
                      <div key={stat.label} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: '10px', border: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{stat.count}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', marginBottom: '8px' }}>{stat.label}</div>
                        <button
                          onClick={() => setCommitmentTab(stat.sub)}
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c27a3a', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          Manage
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inner sub-tabs */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {/* Tab bar */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    {(['collection_month', 'notifications', 'saving_goals', 'commitment_amounts'] as CommitmentSubTab[]).map((sub) => (
                      <button
                        key={sub}
                        id={`commitment-tab-${sub}`}
                        onClick={() => setCommitmentTab(sub)}
                        style={{
                          padding: '14px 20px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          color: commitmentTab === sub ? '#c27a3a' : '#64748b',
                          borderBottom: commitmentTab === sub ? '2px solid #c27a3a' : '2px solid transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {commitmentSubTabLabels[sub]}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ padding: '28px' }}>

                    {/* Collection Month */}
                    {commitmentTab === 'collection_month' && (
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Collection Month Settings</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Control which months are available for collection (harvest) for each commitment amount.</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <select
                              value={selectedCollectionAmount}
                              onChange={(e) => setSelectedCollectionAmount(e.target.value)}
                              className="form-input"
                              style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}
                            >
                              {amounts.filter(a => a.enabled).map(a => {
                                const valStr = Number(a.amount).toFixed(2);
                                return <option key={a.amount} value={valStr}>£{valStr}</option>;
                              })}
                            </select>
                            <button
                              type="button"
                              onClick={handleSaveCollectionMonths}
                              disabled={saving}
                              className="btn btn-primary"
                              style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Save size={15} />
                              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '20px 0 14px 0', color: '#1e293b' }}>
                          Collection Month Settings for £{selectedCollectionAmount}
                        </h4>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '12px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newMap = { ...collectionMonthsMap, [selectedCollectionAmount]: [...ALL_MONTHS] };
                              setCollectionMonthsMap(newMap);
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#2e3a4e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            ☑ Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newMap = { ...collectionMonthsMap, [selectedCollectionAmount]: [] };
                              setCollectionMonthsMap(newMap);
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            ✕ Clear All
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {ALL_MONTHS.map((m) => {
                            const enabled = isMonthEnabled(m);
                            return (
                              <label key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: enabled ? '#f8fafc' : '#ffffff', cursor: 'pointer' }}>
                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{m}</span>
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

                        <p style={{ marginTop: '14px', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem' }}>ℹ️</span>
                          Members will only see the months enabled for the amount tier they select during commitment setup.
                        </p>
                      </div>
                    )}

                    {/* Notification Settings */}
                    {commitmentTab === 'notifications' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Notification Triggers</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Configure automated email and in-app notifications.</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px 12px' }}>
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.8rem' }}>✓ Notifications are active</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                          {[
                            { key: 'emailOnInvite' as const, label: 'Member Invitation Email', desc: 'Dispatch registration invitation when a new user is created.', icon: '👤' },
                            { key: 'emailOnPayment' as const, label: 'Payment Confirmation Email', desc: 'Send receipt email when offline payment is confirmed.', icon: '💳' },
                            { key: 'emailOnPayout' as const, label: 'Harvest Payout Release Email', desc: 'Send notification when harvest payout is released.', icon: '🎁' },
                            { key: 'emailOnReminder' as const, label: 'Monthly Payment Reminder Email', desc: 'Send reminder emails for outstanding contribution payments.', icon: '✉️' },
                          ].map(({ key, label, desc, icon }) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fafafa', cursor: 'pointer', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{icon}</div>
                                <div>
                                  <span style={{ fontWeight: 600, color: '#1e293b', display: 'block', fontSize: '0.9rem' }}>{label}</span>
                                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{desc}</span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={notificationSettings[key]}
                                onChange={() => handleToggleNotification(key)}
                                style={{ width: '18px', height: '18px', accentColor: '#2e3a4e', flexShrink: 0 }}
                              />
                            </label>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveNotificationSettings}
                          disabled={saving}
                          className="btn btn-primary"
                          style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Save size={15} />
                          <span>{saving ? 'Saving...' : 'Save Notification Settings'}</span>
                        </button>
                      </div>
                    )}

                    {/* Saving Goals */}
                    {commitmentTab === 'saving_goals' && (
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Saving Goals Categories</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>Manage categories available for savers to assign to their target savings cycle.</p>

                        <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                          <input
                            type="text"
                            placeholder="Add goal category, e.g. Property Investment"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            className="form-input"
                            style={{ flex: 1, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                          />
                          <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={15} />
                            <span>Add</span>
                          </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {goals.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.875rem', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                              No saving goal categories yet. Add one above.
                            </div>
                          )}
                          {goals.map((g, idx) => (
                            <div key={g.name + idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                                <span style={{ color: '#94a3b8', fontSize: '1rem', cursor: 'grab' }}>⠿</span>
                                <input
                                  type="checkbox"
                                  checked={g.enabled}
                                  onChange={() => handleToggleGoal(idx)}
                                  style={{ width: '18px', height: '18px', accentColor: '#2e3a4e', flexShrink: 0 }}
                                />
                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{g.name}</span>
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGoal(idx)}
                                  style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {goals.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                              <span>⠿ Drag to reorder categories</span>
                              <span>{goals.length} categories</span>
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>✓</span> Savers will only see active categories during commitment setup.
                        </div>
                      </div>
                    )}

                    {/* Commitment Amounts */}
                    {commitmentTab === 'commitment_amounts' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Commitment Amount Tiers (£)</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>Predefined monthly commitment amounts selectable during commitment setup.</p>

                            <form onSubmit={handleAddAmount} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                              <input
                                type="number"
                                placeholder="Add custom amount, e.g. 2000"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                className="form-input"
                                style={{ flex: 1, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                              />
                              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={15} />
                                <span>Add Amount</span>
                              </button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {amounts.map((a, idx) => (
                                <div key={a.amount} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '1rem', cursor: 'grab' }}>⠿</span>
                                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>£{Number(a.amount).toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={a.enabled}
                                        onChange={() => handleToggleAmount(idx)}
                                        style={{ width: '16px', height: '16px', accentColor: '#2e3a4e', cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: '0.8rem', color: a.enabled ? '#15803d' : '#b45309', fontWeight: 600 }}>
                                        {a.enabled ? '✓ Enabled' : 'Disabled'}
                                      </span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAmount(idx)}
                                      style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {amounts.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  <span>⠿ Drag to reorder amounts</span>
                                  <span>{amounts.length} amounts</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* How it works sidebar */}
                          <div style={{ width: '260px', flexShrink: 0, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <span style={{ color: '#16a34a' }}>✔</span>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>How it works</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.5, margin: 0 }}>
                              Enable the amounts you want to offer savers. Only enabled amounts will be available during commitment setup.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overview sub-tab (catch-all) */}
                    {commitmentTab === 'overview' && (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.9rem' }}>
                        Select a sub-section above to manage its settings.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recently Updated footer */}
                <div style={{ marginTop: '20px', padding: '14px 18px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>🕐</span>
                    <span><strong>Recently Updated</strong> — Commitment settings</span>
                  </div>
                  <button style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#c27a3a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Audit Log →
                  </button>
                </div>
              </>
            )}

            {/* ─────────────────────────────── TAB 3: EMAIL TEMPLATES ─────────────────────────────── */}
            {activeTab === 'email-templates' && (
              <>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Email Templates</h2>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Create, edit and manage templates used across the platform.</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={emailSearchQuery}
                      onChange={(e) => setEmailSearchQuery(e.target.value)}
                      className="form-input"
                      style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '8px 14px', width: '240px' }}
                    />
                  </div>

                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Template Name</th>
                          <th>Category</th>
                          <th>Last Updated</th>
                          <th style={{ width: '100px' }}>Status</th>
                          <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTemplates.map((tpl) => {
                          const isEnabled = tpl.enabled !== false;
                          return (
                            <tr key={tpl.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{tpl.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{tpl.reminderHours !== 'N/A' ? `Reminder sent ${tpl.reminderHours}h after due date.` : 'Triggered on event.'}</div>
                              </td>
                              <td>
                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                                  {tpl.reminderHours !== 'N/A' ? 'Reminder' : 'System'}
                                </span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>Template ID: {tpl.id}</td>
                              <td>
                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: isEnabled ? '#dcfce7' : '#fef3c7', color: isEnabled ? '#15803d' : '#b45309' }}>
                                  {isEnabled ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', position: 'relative' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => handleOpenEditTemplate(tpl)}
                                    style={{ background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '4px 8px', color: '#64748b', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                    title="Edit template"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <div style={{ position: 'relative' }}>
                                    <button
                                      onClick={() => setOpenDropdownId(openDropdownId === tpl.id ? null : tpl.id)}
                                      style={{ background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '4px 8px', color: '#64748b', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                    {openDropdownId === tpl.id && (
                                      <div style={{ position: 'absolute', right: 0, top: '30px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '140px', padding: '4px' }}>
                                        <button
                                          onClick={() => handleOpenViewTemplate(tpl)}
                                          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
                                        >
                                          <Eye size={13} />
                                          <span>View Template</span>
                                        </button>
                                        <button
                                          onClick={() => handleOpenEditTemplate(tpl)}
                                          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
                                        >
                                          <Edit size={13} />
                                          <span>Edit Template</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recently Updated footer */}
                <div style={{ marginTop: '20px', padding: '14px 18px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>🕐</span>
                    <span><strong>Recently Updated</strong> — Email templates</span>
                  </div>
                  <button style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#c27a3a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Audit Log →
                  </button>
                </div>
              </>
            )}

            {/* ─────────────────────────────── TAB 4: DATA MIGRATION ─────────────────────────────── */}
            {activeTab === 'migration' && (
              <>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', maxWidth: '860px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Bulk Data Migration & Import Center</h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
                    Migrate legacy Members (with exact Member IDs like <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>M-000374</code>), Savings Commitments (<code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>SC-00222</code>), Payments, and Waiting List records from your previous website into the platform.
                  </p>

                  {/* Mode Switcher */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setMigrationMode('CSV')}
                      style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: '1px solid #cbd5e1', backgroundColor: migrationMode === 'CSV' ? '#2e3a4e' : '#ffffff', color: migrationMode === 'CSV' ? '#ffffff' : '#475569', cursor: 'pointer' }}
                    >
                      📊 CSV / Spreadsheet Copy-Paste (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMigrationMode('JSON')}
                      style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: '1px solid #cbd5e1', backgroundColor: migrationMode === 'JSON' ? '#2e3a4e' : '#ffffff', color: migrationMode === 'JSON' ? '#ffffff' : '#475569', cursor: 'pointer' }}
                    >
                      💻 Raw JSON Payload
                    </button>
                  </div>

                  {/* CSV MODE */}
                  {migrationMode === 'CSV' && (
                    <div>
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>Frontend Table / CSV Copy-Paste Guide</span>
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
                        <input type="file" accept=".csv,.txt,.tsv" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (evt) => setMigrationCsvText(evt.target?.result as string || ''); reader.readAsText(file); }}} style={{ fontSize: '0.8rem' }} />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Paste CSV / TSV Table Rows Below:</label>
                        <textarea rows={9} placeholder={`Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February`} value={migrationCsvText} onChange={(e) => setMigrationCsvText(e.target.value)} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.825rem', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}

                  {/* JSON MODE */}
                  {migrationMode === 'JSON' && (
                    <div>
                      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>JSON Import Schema Format Template</span>
                          <button type="button" onClick={() => { const sample = { users: [{ invitationId: "M-000374", name: "Iyore Ed", email: "iypearlie@gmail.com", phone: "07449311040", role: "MEMBER", isActive: true }], commitments: [{ id: "SC-00222", memberEmail: "iypearlie@gmail.com", amount: 1000, goal: "Savings Goal", collectionMonth: "February", collectionYear: 2027, status: "ACTIVE" }] }; setMigrationJson(JSON.stringify(sample, null, 2)); }} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Load Sample Data</button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Member IDs (<code style={{ color: '#0284c7' }}>invitationId</code>) and Commitment Record IDs (<code style={{ color: '#0284c7' }}>id</code>) will be preserved exactly as specified.</p>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Paste Migration Payload (JSON Format):</label>
                        <textarea rows={9} placeholder={`{\n  "users": [\n    {\n      "invitationId": "M-000374",\n      "name": "Iyore Ed",\n      "email": "iypearlie@gmail.com",\n      "phone": "07449311040",\n      "role": "MEMBER",\n      "isActive": true\n    }\n  ]\n}`} value={migrationJson} onChange={(e) => setMigrationJson(e.target.value)} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.825rem', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#1e293b', cursor: 'pointer' }}>
                      <input type="checkbox" checked={migrationOverwrite} onChange={(e) => setMigrationOverwrite(e.target.checked)} style={{ accentColor: '#2e3a4e' }} />
                      <span>Overwrite / Update existing records matching Email or Member ID</span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    <button type="button" disabled={migrationRunning || (migrationMode === 'CSV' ? !migrationCsvText.trim() : !migrationJson.trim())} onClick={async () => { setMigrationRunning(true); setMigrationError(''); setMigrationReport(null); try { let payload: any = {}; if (migrationMode === 'CSV') { payload = parseCsvToPayload(migrationCsvText); } else { try { payload = JSON.parse(migrationJson); } catch (jsonErr: any) { throw new Error('Invalid JSON format: ' + jsonErr.message); } } const res = await fetch('/api/admin/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, dryRun: true, overwrite: migrationOverwrite }) }); const resText = await res.text(); let data: any = {}; try { data = JSON.parse(resText); } catch (e) { throw new Error(resText || 'Server error occurred during validation'); } if (res.ok) { setMigrationReport(data.report); } else { setMigrationError(data.error || 'Validation failed'); } } catch (err: any) { setMigrationError(err.message || 'Validation failed'); } finally { setMigrationRunning(false); }}} className="btn btn-secondary" style={{ padding: '10px 20px', fontWeight: 600, borderRadius: '8px' }}>
                      {migrationRunning ? 'Validating...' : 'Validate Data (Dry Run)'}
                    </button>
                    <button type="button" disabled={migrationRunning || (migrationMode === 'CSV' ? !migrationCsvText.trim() : !migrationJson.trim())} onClick={async () => { if (!(await dialog.confirm('Confirm Data Migration', 'Are you sure you want to execute full data migration into the live database? All records will be saved.'))) return; setMigrationRunning(true); setMigrationError(''); setMigrationReport(null); try { let payload: any = {}; if (migrationMode === 'CSV') { payload = parseCsvToPayload(migrationCsvText); } else { try { payload = JSON.parse(migrationJson); } catch (jsonErr: any) { throw new Error('Invalid JSON format: ' + jsonErr.message); } } const res = await fetch('/api/admin/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, dryRun: false, overwrite: migrationOverwrite }) }); const resText = await res.text(); let data: any = {}; try { data = JSON.parse(resText); } catch (e) { throw new Error(resText || 'Server error occurred during migration'); } if (res.ok) { setMigrationReport(data.report); } else { setMigrationError(data.error || 'Migration failed'); } } catch (err: any) { setMigrationError(err.message || 'Migration failed'); } finally { setMigrationRunning(false); }}} className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', padding: '10px 24px', fontWeight: 600, borderRadius: '8px' }}>
                      {migrationRunning ? 'Importing Data...' : 'Execute Full Data Migration'}
                    </button>
                  </div>

                  {migrationError && (<div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '20px' }}>{migrationError}</div>)}

                  {migrationReport && (
                    <div style={{ backgroundColor: migrationReport.dryRun ? '#f0fdf4' : '#eff6ff', border: `1px solid ${migrationReport.dryRun ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: migrationReport.dryRun ? '#166534' : '#1e40af', marginBottom: '12px' }}>{migrationReport.dryRun ? '🔍 Dry-Run Validation Summary (No Changes Saved)' : '🎉 Migration Execution Complete Report'}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Users Processed</span><strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.usersProcessed}</strong><span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '2px' }}>+{migrationReport.usersCreated} created / {migrationReport.usersUpdated} updated</span></div>
                        <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Commitments Processed</span><strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.commitmentsProcessed}</strong><span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'block', marginTop: '2px' }}>+{migrationReport.commitmentsCreated} created / {migrationReport.commitmentsUpdated} updated</span></div>
                        <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Payments Logged</span><strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.paymentsCreated}</strong></div>
                        <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Waiting List Entries</span><strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{migrationReport.waitingListCreated}</strong></div>
                      </div>
                      {migrationReport.warnings.length > 0 && (<div style={{ marginBottom: '12px' }}><strong style={{ fontSize: '0.8rem', color: '#d97706', display: 'block', marginBottom: '4px' }}>Warnings ({migrationReport.warnings.length}):</strong><ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#92400e' }}>{migrationReport.warnings.slice(0, 5).map((w: string, i: number) => (<li key={i}>{w}</li>))}</ul></div>)}
                      {migrationReport.errors.length > 0 && (<div><strong style={{ fontSize: '0.8rem', color: '#dc2626', display: 'block', marginBottom: '4px' }}>Errors ({migrationReport.errors.length}):</strong><ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#991b1b' }}>{migrationReport.errors.map((e: string, i: number) => (<li key={i}>{e}</li>))}</ul></div>)}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ── MODALS ── */}

      {activeTopModal === 'AGREEMENT' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>Membership Agreement Content</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Edit the guidelines displayed to savers and site visitors.</p>
            <textarea value={membershipAgreement} onChange={(e) => setMembershipAgreement(e.target.value)} className="form-input" style={{ width: '100%', minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '12px' }} />
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { handleSaveSettingKey('membershipAgreement', membershipAgreement, 'Membership Agreement'); setActiveTopModal('NONE'); }} className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Save Changes</button>
              <button onClick={() => setActiveTopModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {activeTopModal === 'FEE_SCHEDULE' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>Fee Schedule Content</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Edit the fee breakdown and tier schedule displayed to members.</p>
            <textarea value={feeSchedule} onChange={(e) => setFeeSchedule(e.target.value)} className="form-input" style={{ width: '100%', minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '12px' }} />
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { handleSaveSettingKey('feeSchedule', feeSchedule, 'Fee Schedule'); setActiveTopModal('NONE'); }} className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Save Changes</button>
              <button onClick={() => setActiveTopModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {activeTopModal === 'REVIEWS' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveTopModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '550px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveTopModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>Member Reviews & Feedback</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>Member satisfaction metrics and feedback log.</p>
            <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Overall Saver Satisfaction Rating: 5.0 / 5.0 ★★★★★</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.825rem' }}>All member reviews are verified through completed rotating collection cycles.</p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveTopModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {activeEmailModal === 'VIEW' && selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveEmailModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveEmailModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>View Email Template</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>Template ID: {selectedTemplate.id} — {selectedTemplate.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Subject Line</span><p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{selectedTemplate.subject}</p></div>
              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Reminder Time (Hours)</span><p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{selectedTemplate.reminderHours}</p></div>
              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Email Body Content</span><div style={{ marginTop: '6px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedTemplate.body}</div></div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveEmailModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {activeEmailModal === 'EDIT' && selectedTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveEmailModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '650px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveEmailModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>Edit Email Template</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>Modify template content for: {selectedTemplate.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Subject Line *</label>
                <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="form-input" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Reminder Time (Hours)</label>
                  <input type="text" value={editReminderHours} onChange={(e) => setEditReminderHours(e.target.value)} placeholder="e.g. 24 or N/A" className="form-input" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Template Status *</label>
                  <select value={editEnabled ? 'enabled' : 'disabled'} onChange={(e) => setEditEnabled(e.target.value === 'enabled')} className="form-input" style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '10px 14px', fontWeight: 600 }}>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Email Body Content *</label>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="form-input" style={{ width: '100%', minHeight: '180px', fontFamily: 'sans-serif', fontSize: '0.875rem', lineHeight: 1.5, backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', padding: '12px' }} />
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleSaveEditTemplate} disabled={saving} className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>{saving ? 'Saving...' : 'Save Template'}</button>
              <button onClick={() => setActiveEmailModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>Cancel</button>
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
