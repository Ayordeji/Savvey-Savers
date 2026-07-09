'use client';

import { useState, useEffect } from 'react';
import { Settings, CheckSquare, Plus, Save } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';

interface SavingGoal {
  name: string;
  enabled: boolean;
}

interface CommitmentAmount {
  amount: number;
  enabled: boolean;
}

export default function SettingsPage() {
  const dialog = useDialog();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [amounts, setAmounts] = useState<CommitmentAmount[]>([]);
  const [newAmount, setNewAmount] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.savingGoals || []);
        setAmounts(data.commitmentAmounts || []);
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

  const handleToggleGoal = (index: number) => {
    const updated = [...goals];
    updated[index].enabled = !updated[index].enabled;
    setGoals(updated);
    setSuccessMsg('');
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newGoal.trim();
    if (!val) {
      await dialog.alert('Invalid Category', 'Please enter a valid goal category.');
      return;
    }

    // Check duplicate
    if (goals.some((g) => g.name.toLowerCase() === val.toLowerCase())) {
      await dialog.alert('Duplicate Category', 'This category already exists.');
      return;
    }

    const updated = [...goals, { name: val, enabled: true }];
    setGoals(updated);
    setNewGoal('');
    setSuccessMsg('');
  };

  const handleToggleAmount = (index: number) => {
    const updated = [...amounts];
    updated[index].enabled = !updated[index].enabled;
    setAmounts(updated);
    setSuccessMsg('');
  };

  const handleAddAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (isNaN(val) || val <= 0) {
      await dialog.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    // Check duplicate
    if (amounts.some((a) => a.amount === val)) {
      await dialog.alert('Duplicate Amount', 'This amount already exists.');
      return;
    }

    const updated = [...amounts, { amount: val, enabled: true }].sort((a, b) => a.amount - b.amount);
    setAmounts(updated);
    setNewAmount('');
    setSuccessMsg('');
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      // Save goals
      const res1 = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'savingGoals', value: goals })
      });

      // Save amounts
      const res2 = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'commitmentAmounts', value: amounts })
      });

      if (res1.ok && res2.ok) {
        setSuccessMsg('Settings configurations saved successfully.');
      } else {
        await dialog.alert('Save Failed', 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            System Settings
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Configure savings goal categories and allowed monthly commitment amounts.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn btn-primary btn-sm"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: 'var(--status-success-bg)',
          color: 'var(--status-success)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '0.9rem',
          marginBottom: '20px'
        }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Settings...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
          {/* Left panel: Saving Goals */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Saving Goals Categories
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Enable or disable the categories that savers can choose for their commitments.
            </p>

            {/* Add new goal form */}
            <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Add custom goal, e.g. Business Project"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ border: '1px dashed var(--primary)', color: 'var(--primary)' }}>
                <Plus size={16} />
                <span>Add</span>
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {goals.map((g, idx) => (
                <label key={g.name} className="form-checkbox" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.925rem' }}>{g.name}</span>
                  <input
                    type="checkbox"
                    checked={g.enabled}
                    onChange={() => handleToggleGoal(idx)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Right panel: Commitment Amounts */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Commitment Amounts (£)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Select predefined amounts shown in the savings commitments dropdown.
            </p>

            {/* Add new amount form */}
            <form onSubmit={handleAddAmount} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="number"
                placeholder="Add custom amount, e.g. 1500"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ border: '1px dashed var(--primary)', color: 'var(--primary)' }}>
                <Plus size={16} />
                <span>Add</span>
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {amounts.map((a, idx) => (
                <label
                  key={a.amount}
                  className="form-checkbox"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: a.enabled ? 'var(--primary-glow)' : 'transparent',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <strong>£{a.amount}</strong>
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={() => handleToggleAmount(idx)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
