'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  // Check existing session
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          window.location.href = '/dashboard';
        }
      })
      .catch((err) => console.error('Session verify error:', err));
  }, [router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setError('A network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetMessage(data.message || `A password reset link has been dispatched to ${resetEmail}.`);
      } else {
        setResetError(data.error || 'Failed to send password reset link.');
      }
    } catch (err) {
      setResetError('A network error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'var(--font-family-body)',
        color: 'var(--text-main)',
      }}
    >
      <MarketingHeader
        activePath="/login"
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '460px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            padding: '40px 36px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Savvey Savers Member Portal
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                color: 'var(--text-main)',
              }}
            >
              {isForgotPassword ? 'Reset Password' : 'Sign in to your Account'}
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
              }}
            >
              {isForgotPassword
                ? 'Enter your registered email to receive reset instructions.'
                : 'Access your savings cycles, ledger, and contribution records.'}
            </p>
          </div>

          {!isForgotPassword ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

              {/* Email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main)',
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-family-body)',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.backgroundColor = 'var(--bg-card-hover)';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setResetEmail(email);
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 44px 12px 42px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-family-body)',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.backgroundColor = 'var(--bg-card-hover)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-light)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: '8px',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-title)',
                  fontSize: '1rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px var(--primary-glow)',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                {!isLoading && <ArrowRight size={18} />}
              </button>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  marginTop: '10px',
                }}
              >
                Not a member yet?{' '}
                <button
                  type="button"
                  onClick={() => setWaitlistModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Join the Waiting List
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {resetMessage && (
                <div
                  style={{
                    backgroundColor: 'var(--status-active-bg)',
                    color: 'var(--status-active-text)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(12, 78, 67, 0.2)',
                  }}
                >
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{resetMessage}</span>
                </div>
              )}

              {resetError && (
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
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text-main)',
                  }}
                >
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-family-body)',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card-hover)',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-title)',
                  fontSize: '1rem',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  opacity: resetLoading ? 0.7 : 1,
                }}
              >
                {resetLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetMessage('');
                  setResetError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </main>

      <MarketingFooter
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />
    </div>
  );
}
