'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, PiggyBank, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          router.push('/dashboard');
        }
      })
      .catch((err) => console.error('Session verify error:', err));
  }, [router]);

  // Auth Mode State
  const [isSignUp, setIsSignUp] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');



  // Google OAuth states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [showGoogleSimulator, setShowGoogleSimulator] = useState(false);
  const [simulatorEmail, setSimulatorEmail] = useState('');
  const [simulatorName, setSimulatorName] = useState('');

  // Forgot Password States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // Waiting list states
  const [waitName, setWaitName] = useState('');
  const [waitEmail, setWaitEmail] = useState('');
  const [waitPhone, setWaitPhone] = useState('');
  const [waitAmount, setWaitAmount] = useState('');
  const [waitReferrer, setWaitReferrer] = useState('');
  const [waitLoading, setWaitLoading] = useState(false);
  const [waitSuccess, setWaitSuccess] = useState(false);
  const [waitError, setWaitError] = useState('');

  // Check if Firebase is configured, otherwise fallback to simulator
  const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'mock-api-key';

  useEffect(() => {
    if (isFirebaseConfigured) {
      getRedirectResult(auth)
        .then(async (userCredential) => {
          if (userCredential) {
            setGoogleLoading(true);
            const idToken = await userCredential.user.getIdToken();
            await handleGoogleAuth(idToken);
          }
        })
        .catch((err) => {
          console.error('Redirect auth error:', err);
          let message = `Google sign-in failed (${err.code || err.message}). Please try again.`;
          if (err.code === 'auth/popup-blocked') {
            message = 'Google sign-in popup was blocked by your browser. Please enable popups or try again.';
          }
          setGoogleError(message);
        });
    }
  }, [isFirebaseConfigured]);

  // Auto-dismiss errors and status messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loginError) setLoginError('');
      if (resetError) setResetError('');
      if (resetMessage) setResetMessage('');
      if (googleError) setGoogleError('');
      if (waitError) setWaitError('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [loginError, resetError, resetMessage, googleError, waitError]);

  useEffect(() => {
    if (waitSuccess) {
      const timer = setTimeout(() => setWaitSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [waitSuccess]);

  const handleForgotPassword = () => {
    setShowResetModal(true);
    setResetEmail('');
    setResetMessage('');
    setResetError('');
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      if (isFirebaseConfigured) {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail })
        });
        const data = await res.json();
        if (res.ok) {
          setResetMessage(data.message || `A password reset link has been successfully sent to ${resetEmail} via Resend.`);
        } else {
          setResetError(data.error || 'Failed to send password reset email.');
        }
      } else {
        setResetMessage(`[Simulator Mode] Reset link generated for ${resetEmail}.`);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetError('A network error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      let idToken = '';
      
      if (isFirebaseConfigured) {
        // 1. Sign in with Firebase Client Auth
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        idToken = await userCredential.user.getIdToken();
      } else {
        // Fallback simulator: create a mock token
        idToken = `mock_token_${loginEmail.trim()}_Registered User`;
      }

      // 2. Exchange token with local Next.js session route
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setLoginError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Firebase Login Error:', err);
      let message = 'Login failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };



  const handleGoogleAuth = async (idToken: string) => {
    setGoogleLoading(true);
    setGoogleError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setGoogleError(data.error || 'Google authentication failed.');
      }
    } catch (err) {
      setGoogleError('A network error occurred during Google authentication.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      // Trigger simulation mode view
      setShowGoogleSimulator(true);
      setSimulatorEmail('');
      setSimulatorName('');
      setGoogleError('');
      return;
    }

    setGoogleLoading(true);
    setGoogleError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await handleGoogleAuth(idToken);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      let message = `Google sign-in failed (${err.code || err.message}). Please try again.`;
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in popup was closed before authentication.';
      } else if (err.code === 'auth/blocked-by-project') {
        message = 'Google sign-in is blocked. Check your Firebase console configuration.';
      } else if (err.code === 'auth/popup-blocked') {
        console.log('Popup blocked. Falling back to signInWithRedirect...');
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          console.error('Google Redirect Error:', redirectErr);
          message = `Google sign-in was blocked and redirect fallback failed (${redirectErr.code || redirectErr.message}).`;
        }
      }
      setGoogleError(message);
      setGoogleLoading(false);
    }
  };

  const handleWaitingList = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitLoading(true);
    setWaitError('');
    setWaitSuccess(false);

    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: waitName,
          email: waitEmail,
          phone: waitPhone,
          monthlySavingsCommitment: waitAmount,
          referredBy: waitReferrer,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setWaitSuccess(true);
        setWaitName('');
        setWaitEmail('');
        setWaitPhone('');
        setWaitAmount('');
        setWaitReferrer('');
      } else {
        setWaitError(data.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      setWaitError('A network error occurred. Please check your connection.');
    } finally {
      setWaitLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-main)',
      fontFamily: 'var(--font-family-body)',
      color: 'var(--text-main)',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Navbar Header */}
      <header style={{
        height: '80px',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/logo_new-removebg-preview.png"
            alt="Savvey Savers Collective"
            style={{ height: '44px', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            fontFamily: 'var(--font-family-title)',
            color: 'var(--primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            SAVVEY SAVERS
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              COLLECTIVE
            </span>
          </span>
        </div>

        {/* Navigation Links linking back to main site */}
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }} className="hidden-mobile">
          <a href="https://savveysavers.crevianstudios.com/" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-main)'}>Home</a>
          <a href="https://savveysavers.crevianstudios.com/about-us" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-main)'}>About Us</a>
          <a href="https://savveysavers.crevianstudios.com/faqs" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-main)'}>FAQs</a>
        </nav>

        <a
          href="https://savveysavers.crevianstudios.com/"
          style={{
            borderRadius: '9999px',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            backgroundColor: 'transparent',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '10px 22px',
            transition: 'background-color 0.2s, color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--primary)';
          }}
        >
          Back to Website
        </a>
      </header>

      {/* Hero Body */}
      <main style={{
        flex: 1,
        maxWidth: '540px',
        width: '100%',
        margin: '0 auto',
        padding: '50px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>
        {/* Hero Text */}
        <div style={{ textAlign: 'center' }}>
          <span style={{
            color: 'var(--primary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            display: 'inline-block',
            marginBottom: '12px'
          }}>
            SAVVEY SAVERS DASHBOARD PORTAL
          </span>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.15,
            color: 'var(--primary)',
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            Build Wealth Through a <span style={{ fontStyle: 'italic', fontWeight: 800 }}>Trusted</span> Savings Community
          </h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Enter your credentials below to access your personal contribution dashboard, track rotating cycles, and confirm offline payouts securely.
          </p>
        </div>

        {/* Auth Form Panel */}
        <div className="glass-panel" style={{ padding: '32px', backgroundColor: '#ffffff', borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
          {/* Tab Toggles */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: 'var(--bg-main)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { setIsSignUp(false); setLoginError(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !isSignUp ? 'var(--primary)' : 'transparent',
                color: !isSignUp ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setLoginError(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isSignUp ? 'var(--primary)' : 'transparent',
                color: isSignUp ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s'
              }}
            >
              Waiting List
            </button>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px', fontFamily: 'var(--font-family-title)' }}>
            {isSignUp ? 'Join the Waiting List' : 'Sign In to Your Dashboard'}
          </h2>

          {/* Error notifications */}
          {loginError && !isSignUp && (
            <div style={{
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error)',
              border: '1px solid rgba(153, 27, 27, 0.2)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
              {loginError}
            </div>
          )}

          {googleError && (
            <div style={{
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error)',
              border: '1px solid rgba(153, 27, 27, 0.2)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
              {googleError}
            </div>
          )}

          {!isSignUp ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@savveysavers.com"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading || googleLoading}
                className="btn"
                style={{
                  width: '100%',
                  marginTop: '8px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '46px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                {loginLoading ? 'Authenticating...' : 'Sign In'}
                {!loginLoading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
              </button>
            </form>
          ) : (
            /* WAITING LIST FORM */
            <>
              {waitSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-success-bg)',
                    color: 'var(--status-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-family-title)' }}>
                    You are on the Waiting List!
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Thank you for expressing interest. Our administrators will review your application and send an invitation email with dashboard access links if approved.
                  </p>
                  <button
                    onClick={() => setWaitSuccess(false)}
                    className="btn btn-secondary"
                    style={{ marginTop: '16px', borderRadius: '9999px', width: '100%' }}
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWaitingList} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                      <input
                        type="text"
                        required
                        value={waitName}
                        onChange={(e) => setWaitName(e.target.value)}
                        placeholder="Jane Smith"
                        className="form-input"
                        style={{
                          paddingLeft: '38px',
                          backgroundColor: 'var(--bg-main)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                      <input
                        type="email"
                        required
                        value={waitEmail}
                        onChange={(e) => setWaitEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="form-input"
                        style={{
                          paddingLeft: '38px',
                          backgroundColor: 'var(--bg-main)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                      <input
                        type="tel"
                        required
                        value={waitPhone}
                        onChange={(e) => setWaitPhone(e.target.value)}
                        placeholder="+44 7700 900022"
                        className="form-input"
                        style={{
                          paddingLeft: '38px',
                          backgroundColor: 'var(--bg-main)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Intended Monthly Saving Commitment (£)</label>
                    <div style={{ position: 'relative' }}>
                      <PiggyBank size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                      <input
                        type="number"
                        required
                        min="1"
                        value={waitAmount}
                        onChange={(e) => setWaitAmount(e.target.value)}
                        placeholder="300"
                        className="form-input"
                        style={{
                          paddingLeft: '38px',
                          backgroundColor: 'var(--bg-main)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Referred By (Optional Member Name)</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                      <input
                        type="text"
                        value={waitReferrer}
                        onChange={(e) => setWaitReferrer(e.target.value)}
                        placeholder="John Doe"
                        className="form-input"
                        style={{
                          paddingLeft: '38px',
                          backgroundColor: 'var(--bg-main)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-main)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={waitLoading}
                    className="btn"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      height: '44px',
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                  >
                    {waitLoading ? 'Submitting Application...' : 'Register for Waiting List'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 12px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          {/* Google Sign-In Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!showGoogleSimulator ? (
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || loginLoading}
                className="btn"
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '44px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '6px' }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {isFirebaseConfigured ? 'Sign in with Google' : 'Google Sign-In (Simulator)'}
              </button>
            ) : (
              <div className="glass-panel" style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--primary)' }}>
                  Google Auth Simulator
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '12px' }}>
                  Select a simulation profile below to login:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleGoogleAuth('mock_token_member@savveysavers.com_' + encodeURIComponent('Saver'))}
                    disabled={googleLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '9999px' }}
                  >
                    Simulate Normal Saver Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleAuth('mock_token_admin@savveysavers.com_' + encodeURIComponent('Admin'))}
                    disabled={googleLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: '9999px' }}
                  >
                    Simulate Group Admin Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoogleSimulator(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center', borderColor: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem' }}
                  >
                    Cancel Simulator
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      <footer style={{
        padding: '32px 24px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        maxWidth: '540px',
        width: '100%',
        margin: '0 auto',
        lineHeight: 1.5
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          fontWeight: 700,
          flexShrink: 0
        }}>₦</div>
        <span>© 2026 Savvey Savers group platform. All rights reserved. Registered savings metrics are for record-keeping purposes. Financial transactions occur offline.</span>
      </footer>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '400px',
            padding: '32px',
            backgroundColor: '#ffffff',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-lg)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => {
                setShowResetModal(false);
                setResetEmail('');
                setResetMessage('');
                setResetError('');
              }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)', fontFamily: 'var(--font-family-title)' }}>
              Reset Password
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {resetError && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {resetError}
              </div>
            )}

            {resetMessage && (
              <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleSendPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetEmail('');
                    setResetMessage('');
                    setResetError('');
                  }}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '9999px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '38px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                >
                  {resetLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
