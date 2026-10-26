'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type JoinInvitationFormProps = {
  referrerId: string;
};

export default function JoinInvitationForm({ referrerId }: JoinInvitationFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const monthlySavingsCommitment = '100';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!referrerId) {
      setError('This invitation link is missing its referral code. Please ask the member to send you a new link.');
      return;
    }

    const cleanedPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (!/^(\+44|0)[1-9]\d{8,9}$/.test(cleanedPhone)) {
      setError('Please enter a valid UK phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          monthlySavingsCommitment,
          referredBy: referrerId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to submit your invitation. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('A network error occurred while submitting your invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '580px',
          padding: '32px',
          borderRadius: '16px',
          backgroundColor: '#fff',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <p style={{ color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Member Invitation
        </p>
        <h1 style={{ margin: '8px 0', fontSize: '1.6rem' }}>Invite New Member</h1>
        <p style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Complete the member invitation form below. Your application will be sent to our team for review.
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle2 size={44} color="var(--primary)" />
            <h2 style={{ margin: '12px 0 8px', fontSize: '1.25rem' }}>Invitation submitted</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Thank you. Your invitation is now pending admin approval.
            </p>
            <Link href="/" style={{ display: 'inline-block', marginTop: '20px', color: 'var(--primary)', fontWeight: 600 }}>
              Return to Savvey Savers
            </Link>
          </div>
        ) : !referrerId ? (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--status-error)', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--status-error-bg)' }}>
            <AlertCircle size={18} />
            <span>This invitation link is missing its referral code. Please ask the member to send you a new link.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--status-error)', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--status-error-bg)' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="join-first-name">First Name *</label>
              <input id="join-first-name" className="form-input" autoComplete="given-name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="join-last-name">Last Name *</label>
              <input id="join-last-name" className="form-input" autoComplete="family-name" required value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="join-email">Email Address *</label>
              <input id="join-email" className="form-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="join-phone">Phone Number *</label>
              <input id="join-phone" className="form-input" type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', borderRadius: '8px', padding: '12px 20px', fontWeight: 700 }}>
              {isSubmitting ? 'Submitting...' : 'Submit Invitation'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
