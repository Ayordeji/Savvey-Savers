'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Check, X } from 'lucide-react';
// Firebase auth removed — using JWT-based auth

const DEFAULT_SECURITY_QUESTIONS = [
  "What City were you born in?",
  "In what city did your parents meet?",
  "What's your favourite movie?",
  "Who is your favourite celebrity?",
  "What model was your first car?"
];

const DEFAULT_AGREEMENT = `<h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: #1e293b;">
  Savvey Savers Network Limited Membership Agreement
</h4>
<p style="margin-bottom: 12px;">By becoming a network member of <strong>Savvey Savers Network Limited</strong>, you agree to the terms stated in this membership agreement.</p>
<p style="margin-bottom: 16px;">This Membership Agreement is entered into by and between <strong>Savvey Savers Network Limited</strong>, hereinafter referred to as the "Platform," any registered platform member that has paid a membership fee, hereinafter referred to as the "Member" or "Network Member."</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">1. MEMBERSHIP</h5>
<p style="margin-bottom: 8px;"><strong>1.1. Eligibility:</strong> You must be <strong>18 years or older</strong> to become a Network Member of Savvey Savers Network Limited; and by signing this Agreement, the Member confirms that they meet the eligibility criteria for membership as specified by the Platform.</p>
<p style="margin-bottom: 16px;"><strong>1.2. Term:</strong> This membership is effective as of the date of acceptance and payment of the annual membership fee; and shall continue for a minimum period of <strong>12 calendar months</strong> unless terminated by either party in accordance with the terms herein.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">2. PLATFORM SERVICES AND OBLIGATIONS</h5>
<p style="margin-bottom: 8px;"><strong>2.1. Peer-to-Peer Savings:</strong> The Platform is an <strong>“invite-only” platform</strong> that provides a peer-to-peer savings service that connects likeminded Members who wish to contribute a pre-agreed savings amount monthly; and disburse the total saved amount interest-free as a harvest to any Member(s) due a collection that month.</p>
<p style="margin-bottom: 16px;"><strong>2.2. Access:</strong> Members will have access to the Platform's website or application and associated services during the term of their membership.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">3. MEMBERSHIP FEES</h5>
<p style="margin-bottom: 8px;"><strong>3.1. Annual Membership Fee:</strong> The Member agrees to pay a membership fee as determined by the Platform. The membership fee is payable in advance and is <strong>non-refundable</strong>.</p>
<p style="margin-bottom: 16px;"><strong>3.2. Payment Method:</strong> The Member agrees to pay the annual membership fee into the bank account details supplied to them by their Relationship Manager.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">4. SAVINGS CONTRIBUTIONS</h5>
<p style="margin-bottom: 8px;"><strong>4.1. Payment Due Date:</strong> Monthly contribution payments are due on the <strong>28th day</strong> of each calendar month.</p>
<p style="margin-bottom: 8px;"><strong>4.2. Contribution Schedule:</strong> Members agree to contribute their pre-agreed Savings Commitment amount to the peer-to-peer savings pool on a monthly basis until the end of the Cycle.</p>`;

function ActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invite') || searchParams.get('reset');

  const [step, setStep] = useState<1 | 2>(1);
  const [verifying, setVerifying] = useState(true);
  const [linkError, setLinkError] = useState('');

  // Step 1 Registration details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [country] = useState('UNITED KINGDOM');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementHtml, setAgreementHtml] = useState(DEFAULT_AGREEMENT);

  // Step 2 Password Setup & Security Questions
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState<string[]>(DEFAULT_SECURITY_QUESTIONS);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ [q: string]: string }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (invitationId) {
      fetch(`/api/auth/activate?invite=${invitationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setEmail(data.email || '');
            if (data.name) {
              const parts = data.name.split(' ');
              setFirstName(data.firstName || parts[0] || '');
              setLastName(data.lastName || parts.slice(1).join(' ') || '');
            }
            if (data.phone) setPhone(data.phone);
            if (data.addressLine1) setAddressLine1(data.addressLine1);
            if (data.addressLine2) setAddressLine2(data.addressLine2);
            if (data.city) setCity(data.city);
            if (data.postCode) setPostCode(data.postCode);
          } else {
            setLinkError(data.error || 'Invalid or expired invitation code.');
          }
        })
        .catch(() => {
          setLinkError('Failed to verify invitation link. Please check your connection.');
        })
        .finally(() => {
          setVerifying(false);
        });

      // Fetch Security Questions and Agreement
      fetch('/api/admin/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.securityQuestions && data.securityQuestions.length > 0) {
            setSecurityQuestions(data.securityQuestions);
          }
          if (data.membershipAgreement) {
            setAgreementHtml(data.membershipAgreement);
          }
        })
        .catch(() => {});
    } else {
      setVerifying(false);
    }
  }, [invitationId]);

  // Real-time password complexity validation checks
  const ruleLength = password.length >= 8;
  const ruleCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const ruleNumber = /[0-9]/.test(password);
  const ruleSpecial = /[£$#!*&]/.test(password);
  const isPasswordValid = ruleLength && ruleCase && ruleNumber && ruleSpecial;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError('You must accept the Terms & Conditions of this website to proceed.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !postCode.trim()) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    setStep(2);
  };

  const handleQuestionToggle = (q: string) => {
    if (selectedQuestions.includes(q)) {
      setSelectedQuestions(selectedQuestions.filter((item) => item !== q));
    } else {
      if (selectedQuestions.length < 2) {
        setSelectedQuestions([...selectedQuestions, q]);
      }
    }
  };

  const handleAnswerChange = (q: string, val: string) => {
    setAnswers({ ...answers, [q]: val });
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    if (selectedQuestions.length < 2) {
      setError('Please select and answer exactly two security questions.');
      return;
    }

    const unAnswered = selectedQuestions.some((q) => !answers[q] || !answers[q].trim());
    if (unAnswered) {
      setError('Please provide an answer for both selected security questions.');
      return;
    }

    setLoading(true);

    try {
      const securityQuestionsData = selectedQuestions.map((q) => ({
        question: q,
        answer: answers[q].trim(),
      }));

      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          password,
          firstName,
          lastName,
          phone,
          addressLine1,
          addressLine2,
          city,
          postCode,
          country: 'UNITED KINGDOM',
          termsAccepted: true,
          securityQuestions: securityQuestionsData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);

        // Perform auto sign-in using JWT auth
        try {
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
        } catch (loginErr) {
          console.warn('Auto sign-in after activation failed:', loginErr);
        }

        // Direct user to Savings Commitment tab (/dashboard/commitments)
        setTimeout(() => {
          router.push('/dashboard/commitments');
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || 'Failed to set up account password.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  if (linkError || !invitationId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', maxWidth: '450px', backgroundColor: '#ffffff', borderRadius: '16px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1.4rem', fontWeight: 700 }}>
            Invalid Activation Link
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {linkError || 'This link does not contain a valid invitation code. Please contact your Savvey Savers administrator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      padding: '32px 16px',
      fontFamily: 'var(--font-family-body)',
      color: 'var(--text-main)'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '36px 32px',
        borderRadius: '24px',
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center' }}>
          <img
            src="/logo_new-removebg-preview.png"
            alt="Savvey Savers"
            style={{ width: '54px', height: '54px', objectFit: 'contain', marginBottom: '12px' }}
          />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-main)', margin: 0 }}>
            {step === 1 ? 'Create Your Account' : 'Setup Password & Security'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Step {step} of 2 • Savvey Savers Invitation Activation
          </span>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={56} style={{ color: 'var(--status-completed)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Account Setup Complete!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Redirecting to your Savings Commitments dashboard...
            </p>
          </div>
        ) : step === 1 ? (
          /* STEP 1: ACCOUNT REGISTRATION FORM */
          <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 900022"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Address Line 1"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Address Line 2</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Address Line 2"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Post Code *</label>
                <input
                  type="text"
                  required
                  value={postCode}
                  onChange={(e) => setPostCode(e.target.value)}
                  placeholder="Post Code"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Country</label>
              <input
                type="text"
                disabled
                value="UNITED KINGDOM"
                className="form-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'not-allowed' }}
              />
            </div>

            {/* Terms & Conditions Checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '6px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span>
                I accept the{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAgreementModal(true);
                  }}
                  style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
                >
                  Membership Terms & Conditions
                </span>{' '}
                of Savvey Savers Network Limited
              </span>
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', marginTop: '8px', cursor: 'pointer' }}
            >
              Proceed to Security Setup
            </button>
          </form>
        ) : (
            /* STEP 2: SETUP PASSWORD & SECURITY QUESTIONS FORM (Matching Screenshot 2) */
            <form onSubmit={handleStep2Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Username</label>
                <input
                  type="text"
                  disabled
                  value={email}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="form-input"
                    style={{ width: '100%', padding: '10px 38px 10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Complexity Checklist (Matching Screenshot 2) */}
              <div style={{ backgroundColor: '#fff5f5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fed7d7', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 600, color: '#dc2626', display: 'block', marginBottom: '8px' }}>Password should be:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: ruleLength ? '#16a34a' : '#dc2626' }}>
                    {ruleLength ? <Check size={14} /> : <X size={14} />}
                    <span>8 or more characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: ruleCase ? '#16a34a' : '#dc2626' }}>
                    {ruleCase ? <Check size={14} /> : <X size={14} />}
                    <span>At least one upper and one lowercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: ruleNumber ? '#16a34a' : '#dc2626' }}>
                    {ruleNumber ? <Check size={14} /> : <X size={14} />}
                    <span>At least one number</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: ruleSpecial ? '#16a34a' : '#dc2626' }}>
                    {ruleSpecial ? <Check size={14} /> : <X size={14} />}
                    <span>At least one of the following special characters [ £ $ # ! * & ]</span>
                  </div>
                </div>
              </div>

              {/* Password Security Questions Section */}
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  Password Security Question (Select Any Two)
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>
                  Choose 2 questions and provide answers for account recovery compliance.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {securityQuestions.map((q) => {
                    const isSelected = selectedQuestions.includes(q);
                    return (
                      <div key={q} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', backgroundColor: isSelected ? '#f8fafc' : '#ffffff' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleQuestionToggle(q)}
                            style={{ width: '16px', height: '16px', accentColor: '#1e293b' }}
                          />
                          <span>{q}</span>
                        </label>
                        {isSelected && (
                          <input
                            type="text"
                            required
                            value={answers[q] || ''}
                            onChange={(e) => handleAnswerChange(q, e.target.value)}
                            placeholder="Enter your answer..."
                            className="form-input"
                            style={{ width: '100%', marginTop: '8px', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 2, backgroundColor: '#1e293b', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                >
                  {loading ? 'Setting Up...' : 'Setup password'}
                </button>
              </div>
            </form>
          )}
        </div>

      {/* --- TERMS & CONDITIONS MODAL OVERLAY --- */}
      {showAgreementModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAgreementModal(false); }} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '750px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setShowAgreementModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>
              Savvey Savers Network Limited Membership Agreement
            </h3>
            <div
              dangerouslySetInnerHTML={{ __html: agreementHtml }}
              style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
            />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowAgreementModal(false);
                }}
                className="btn btn-primary"
                style={{ backgroundColor: '#10b981', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                I Accept Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    }>
      <ActivationContent />
    </Suspense>
  );
}
