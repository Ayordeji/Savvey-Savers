'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, PiggyBank, ArrowRight, CheckCircle2, Eye, EyeOff, FileText, CalendarRange, Star, X } from 'lucide-react';
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

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.membershipAgreement) setMembershipAgreement(data.membershipAgreement);
        if (data.feeSchedule) setFeeSchedule(data.feeSchedule);
      })
      .catch((err) => console.error('Settings fetch error:', err));
  }, [router]);

  const [showPassword, setShowPassword] = useState(false);
  const [landingModal, setLandingModal] = useState<'NONE' | 'AGREEMENT' | 'SCHEDULE' | 'REVIEWS'>('NONE');
  const [membershipAgreement, setMembershipAgreement] = useState('');
  const [feeSchedule, setFeeSchedule] = useState('');

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
  const [hasReferrer, setHasReferrer] = useState(false);
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

    // Strict UK Phone Number check (+44 or 07...)
    const cleanedPhone = waitPhone.trim().replace(/[\s\-\(\)]/g, '');
    const isUkPhone = /^(\+44|0)[1-9]\d{8,9}$/.test(cleanedPhone);

    if (!isUkPhone) {
      setWaitError('Only valid UK phone numbers (e.g. +44 7700 900022 or 07700900022) are accepted.');
      setWaitLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: waitName,
          email: waitEmail,
          phone: waitPhone,
          monthlySavingsCommitment: waitAmount,
          referredBy: hasReferrer ? waitReferrer : '',
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
        setHasReferrer(false);
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
        <a href="https://savveysavers.crevianstudios.com/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Savvey Savers Main Site">
          <img
            src="/logo_new-removebg-preview.png"
            alt="Savvey Savers"
            style={{ height: '48px', objectFit: 'contain', cursor: 'pointer' }}
          />
        </a>

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
            fontSize: '2.2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.15,
            color: 'var(--primary)',
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            Savvey Savers Collective Member Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            If you are already a member, enter you login credentials below to access your personal dashboard and more.
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      paddingRight: '40px',
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                  {waitError && (
                    <div style={{
                      backgroundColor: 'var(--status-error-bg)',
                      color: 'var(--status-error)',
                      border: '1px solid rgba(153, 27, 27, 0.2)',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      marginBottom: '8px'
                    }}>
                      ⚠️ {waitError}
                    </div>
                  )}
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
                    <label className="form-label" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Target Monthly Savings (£)</label>
                    <select
                      required
                      value={waitAmount}
                      onChange={(e) => setWaitAmount(e.target.value)}
                      className="form-input"
                      style={{
                        paddingLeft: '14px',
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <option value="">Select target amount...</option>
                      <option value="250">£250</option>
                      <option value="500">£500</option>
                      <option value="750">£750</option>
                      <option value="1000">£1000</option>
                      <option value="1000+">£1000+</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={hasReferrer}
                        onChange={(e) => {
                          setHasReferrer(e.target.checked);
                          if (!e.target.checked) setWaitReferrer('');
                        }}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <span>Referred by a Member? Enter their name below.</span>
                    </label>

                    {hasReferrer && (
                      <div style={{ position: 'relative', marginTop: '10px' }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--primary)' }} />
                        <input
                          type="text"
                          required
                          value={waitReferrer}
                          onChange={(e) => setWaitReferrer(e.target.value)}
                          placeholder="Enter member's name"
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
                    )}
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

        </div>
      </main>

      <footer style={{
        padding: '32px 24px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        maxWidth: '540px',
        width: '100%',
        margin: '0 auto',
        lineHeight: 1.5,
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>© 2026 Savvey Savers Collective.</p>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.75rem' }}>We protect your personal data in accordance with GDPR and applicable data protection laws.</p>
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

      {/* --- MEMBERSHIP AGREEMENT MODAL --- */}
      {landingModal === 'AGREEMENT' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', backgroundColor: '#ffffff' }}>
            <button onClick={() => setLandingModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Membership Agreement
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Group rotating savings terms and conditions.
            </p>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, maxHeight: '350px', overflowY: 'auto', paddingRight: '10px', whiteSpace: 'pre-wrap' }}>
              {membershipAgreement || (
                <>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>1. Term of Agreement:</strong> This agreement regulates the guidelines of the Savvey Savers savings circle. By joining, members commit to a full collection rotation cycle.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>2. Payout Rotation Schedule:</strong> The schedule is generated dynamically at the cycle start. All payout requests must be approved by the circle Coordinator.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>3. Delinquency & Penalties:</strong> Late monthly deposits will trigger system notifications. Chronic delays will result in membership suspension and temporary payout deferral.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>4. Off-Platform Settlements:</strong> All cash transfers occur offline. The platform is solely a record-keeping system. No funds are stored on this digital server.
                  </p>
                </>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setLandingModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEE SCHEDULE MODAL --- */}
      {landingModal === 'SCHEDULE' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px', backgroundColor: '#ffffff' }}>
            <button onClick={() => setLandingModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Fee Schedule
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Associated administrative charges by membership tier.
            </p>

            {feeSchedule ? (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '350px', overflowY: 'auto' }}>
                {feeSchedule}
              </div>
            ) : (
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Membership Tier</th>
                    <th>Monthly Admin Fee</th>
                    <th>Payout Processing Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Standard Saver</td>
                    <td>£5.00</td>
                    <td>0.5%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Premium Gold</td>
                    <td>£10.00</td>
                    <td>0.2%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>VIP Elite</td>
                    <td>£25.00</td>
                    <td>0%</td>
                  </tr>
                </tbody>
              </table>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setLandingModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REVIEWS MODAL --- */}
      {landingModal === 'REVIEWS' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#ffffff' }}>
            <button onClick={() => setLandingModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Reviews & Feedback
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Member experiences and community feedback.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '4px' }}>
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "Platform makes our monthly rotations incredibly transparent. No more spreadsheet arguments!"
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>- John D. (Premium Gold)</span>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '4px' }}>
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "Organizing rotating payouts with friends has never been so seamless and automated."
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>- Sarah M. (Standard Saver)</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setLandingModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
