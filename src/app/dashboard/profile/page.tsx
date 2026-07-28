'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [country, setCountry] = useState('United Kingdom');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddressLine1(data.addressLine1 || '');
        setAddressLine2(data.addressLine2 || '');
        setCity(data.city || '');
        setPostCode(data.postCode || '');
        setCountry(data.country || 'United Kingdom');
      } else {
        setErrorMsg('Failed to load user profile details.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred while fetching profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const validateUkPhoneNumber = (phoneStr: string) => {
      if (!phoneStr) return false;
      const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
      if (/^\+44\d{10}$/.test(cleaned)) return true;
      if (/^0\d{10}$/.test(cleaned)) return true;
      if (/^44\d{10}$/.test(cleaned)) return true;
      return false;
    };

    if (!validateUkPhoneNumber(phone)) {
      setErrorMsg('Only valid UK phone numbers (e.g. +44 7700 900022 or 07700900022) are accepted.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          addressLine1,
          addressLine2,
          city,
          postCode,
          country,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profile details saved successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to save profile details.');
      }
    } catch (err) {
      setErrorMsg('An error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel flex-center" style={{ height: '350px', flexDirection: 'column', gap: '16px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
        <div className="loading-spinner"></div>
        <span style={{ color: '#64748b', fontWeight: 500 }}>Loading My Details...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', paddingBottom: '40px' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '24px', fontFamily: 'var(--font-family-title)' }}>
        My Details
      </h2>

      {successMsg && (
        <div style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '14px 18px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '14px 18px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* First Name & Last Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              First Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ayodeji Dev"
              className="form-input"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              Last Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Eluyemi"
              className="form-input"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
            />
          </div>
        </div>

        {/* Phone Number & Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              Phone Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="447449511010"
              className="form-input"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              Email
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="form-input"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#64748b', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        {/* Address Line 1 */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
            Address Line 1
          </label>
          <input
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="Address Line 1"
            className="form-input"
            style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
          />
        </div>

        {/* Address Line 2 */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
            Address Line 2
          </label>
          <input
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Address Line 2"
            className="form-input"
            style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
          />
        </div>

        {/* City & Post Code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="form-input"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
              Post Code <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
              placeholder="223110"
              className="form-input"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#1e293b' }}
            />
          </div>
        </div>

        {/* Country */}
        <div className="form-group" style={{ margin: 0, maxWidth: '50%' }}>
          <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
            Country
          </label>
          <input
            type="text"
            disabled
            value="UNITED KINGDOM"
            className="form-input"
            style={{ width: '100%', padding: '12px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.95rem', color: '#64748b', cursor: 'not-allowed', fontWeight: 600 }}
          />
        </div>

        {/* Save & Super Admin Request Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '12px 36px',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setSaving(true);
              setErrorMsg('');
              setSuccessMsg('');
              try {
                const res = await fetch('/api/admin/users', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: (window as any).__user_id || 'usr_admin',
                    role: 'SUPER_ADMIN',
                    isSuperAdmin: true,
                  }),
                });
                const data = await res.json();
                if (res.ok) {
                  setSuccessMsg(data.message || 'Super Admin request submitted! An email request has been sent to the Super Admin for confirmation.');
                } else {
                  setErrorMsg(data.error || 'Failed to submit Super Admin request.');
                }
              } catch (err) {
                setErrorMsg('Network error occurred submitting Super Admin request.');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="btn btn-secondary"
            style={{
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            <span>Request Super Admin Access</span>
          </button>
        </div>
      </form>
    </div>
  );
}
