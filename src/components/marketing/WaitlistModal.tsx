'use client';

import { useState } from 'react';
import { X, User, Mail, Phone, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('£500');
  const [hasReferrer, setHasReferrer] = useState(false);
  const [referrer, setReferrer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateUkPhoneNumber = (phoneStr: string) => {
    if (!phoneStr) return false;
    const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
    if (/^\+44\d{10}$/.test(cleaned)) return true;
    if (/^0\d{10}$/.test(cleaned)) return true;
    if (/^44\d{10}$/.test(cleaned)) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateUkPhoneNumber(phone)) {
      setError('Please provide a valid UK phone number (e.g. +44 7700 900022 or 07700 900022).');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          monthlySavingsCommitment: amount,
          referredBy: hasReferrer ? referrer : '',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
      } else {
        setError(data.error || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAmount('£500');
    setReferrer('');
    setHasReferrer(false);
    setIsSuccess(false);
    setError('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(9, 14, 12, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleReset();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '480px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          position: 'relative',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--secondary)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              UK Residents Only · Referral & Vetted
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                fontFamily: 'var(--font-family-title)',
                color: 'var(--text-main)',
              }}
            >
              Join Our Waiting List
            </h3>
          </div>

          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {isSuccess ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-active-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h4
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-title)',
                  color: 'var(--primary)',
                  margin: 0,
                }}
              >
                Application Submitted!
              </h4>
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                  margin: 0,
                }}
              >
                Thank you for your interest in Savvey Savers Collective. Our onboarding team reviews every applicant to maintain circle trust and governance. We will be in touch via email or phone regarding upcoming cycle availability.
              </p>
              <button
                onClick={handleReset}
                style={{
                  marginTop: '12px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-title)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Apply to join a governed savings cycle. Places are assigned on rolling vetting and cycle matching.
              </p>

              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--status-error-bg)',
                    color: 'var(--status-error)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(153, 27, 27, 0.2)',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Adeleke"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                  />
                </div>
              </div>

              {/* UK Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  UK Phone Number (Mobile)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900022 or 07700 900022"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                  />
                </div>
              </div>

              {/* Monthly Savings Target */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Desired Monthly Contribution Target
                </label>
                <select
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'var(--bg-card-hover)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value="£250">£250 per month</option>
                  <option value="£500">£500 per month</option>
                  <option value="£1,000">£1,000 per month</option>
                  <option value="£2,000">£2,000 per month</option>
                  <option value="£3,000+">£3,000+ per month</option>
                </select>
              </div>

              {/* Referral toggle */}
              <div style={{ marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasReferrer}
                    onChange={(e) => setHasReferrer(e.target.checked)}
                    style={{ accentColor: 'var(--secondary)' }}
                  />
                  <span>Were you referred by an existing member?</span>
                </label>
                {hasReferrer && (
                  <input
                    type="text"
                    value={referrer}
                    onChange={(e) => setReferrer(e.target.value)}
                    placeholder="Enter referring member's name"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: '8px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--secondary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-title)',
                  fontSize: '0.95rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px var(--secondary-glow)',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
              >
                <span>{isLoading ? 'Submitting Application...' : 'Submit Waiting List Application'}</span>
                {!isLoading && <ArrowRight size={16} />}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-light)',
                  marginTop: '4px',
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
                <span>Your information is protected under GDPR. We never share your data.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
