'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, CheckCircle2, User, KeyRound, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invite');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);

  // Mount verification states
  const [verifying, setVerifying] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const isSubmitting = useRef(false);

  useEffect(() => {
    if (invitationId) {
      fetch(`/api/auth/activate?invite=${invitationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setEmail(data.email);
            setName(data.name);
          } else {
            setLinkError(data.error);
          }
        })
        .catch(() => {
          setLinkError('Failed to verify invitation link. Please check your connection.');
        })
        .finally(() => {
          setVerifying(false);
        });
    } else {
      setVerifying(false);
    }
  }, [invitationId]);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setError('');

    if (!invitationId) {
      setError('Missing invitation code in the URL. Please verify your link.');
      isSubmitting.current = false;
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      isSubmitting.current = false;
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      isSubmitting.current = false;
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'mock-api-key';
        
        let idToken = '';
        let loginSuccess = false;
        if (isFirebaseConfigured) {
          // Retry signing in up to 3 times to handle any replication lag
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const userCredential = await signInWithEmailAndPassword(auth, data.email, password);
              idToken = await userCredential.user.getIdToken();
              break;
            } catch (fbErr) {
              console.warn(`Firebase Auth sign in attempt ${attempt} failed:`, fbErr);
              if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }
        } else {
          idToken = `mock_token_${data.email}_Registered User`;
        }

        if (idToken) {
          try {
            const loginRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken })
            });
            if (loginRes.ok) {
              loginSuccess = true;
            }
          } catch (loginErr) {
            console.error('Session login call failed:', loginErr);
          }
        }

        setSuccess(true);
        if (loginSuccess || !isFirebaseConfigured) {
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 2000);
        } else {
          setAutoLoginFailed(true);
        }
      } else {
        setError(data.error || 'Failed to activate account.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  if (verifying) {
    return (
      <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Verifying invitation link...</p>
      </div>
    );
  }

  if (linkError || !invitationId) {
    return (
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <h2 style={{ color: 'var(--status-error)', marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
          Invalid Activation Link
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {linkError || 'This link does not contain a valid invitation code. Please contact your Savvey Savers coordinator to receive a new invitation link.'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '36px', maxWidth: '450px', width: '100%' }}>
      {success ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle2 size={56} style={{ color: 'var(--status-success)' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Account Activated!
          </h2>
          {autoLoginFailed ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Your account is active, but we couldn't log you in automatically. Please proceed to the login page to sign in manually.
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn btn-primary"
                style={{ marginTop: '12px' }}
              >
                Go to Login Page
              </button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Your account is now active. You are being logged in and redirected to the dashboard...
              </p>
              <div className="loading-spinner" style={{ marginTop: '12px' }}></div>
            </>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', marginBottom: '6px' }}>
              Set Your Password
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Create a secure password to activate your Savvey Savers account for <strong style={{ color: 'white' }}>{email}</strong>.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Activating...' : 'Activate Account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at bottom, #111827 0%, #07090e 100%)',
      padding: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: '1.2rem'
        }}>₦</div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'white' }}>
          Savvey Savers
        </span>
      </div>

      <Suspense fallback={
        <div className="glass-panel flex-center" style={{ padding: '32px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading invite...</span>
        </div>
      }>
        <ActivationForm />
      </Suspense>
    </div>
  );
}
