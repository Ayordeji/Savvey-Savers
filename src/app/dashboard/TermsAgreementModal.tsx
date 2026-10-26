'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface TermsAgreementModalProps {
  initialTermsAccepted: boolean;
  userRole?: string;
  agreementHtml?: string;
}

export default function TermsAgreementModal({
  initialTermsAccepted,
  userRole,
  agreementHtml
}: TermsAgreementModalProps) {
  const router = useRouter();
  // Only show if terms not yet accepted
  const [showModal, setShowModal] = useState(!initialTermsAccepted);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!showModal) {
    return null;
  }

  const handleAcceptTerms = async () => {
    if (!agreed || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsAccepted: true })
      });

      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        setError(data.error || 'Failed to submit agreement. Please try again.');
      }
    } catch (err) {
      console.error('Error accepting terms:', err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid #ECE8E2',
            backgroundColor: '#FAF9F6'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#EAF5EE',
                color: '#0c4e43',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#111827',
                  margin: 0,
                  fontFamily: 'var(--font-family-title, sans-serif)'
                }}
              >
                Terms of Use & Platform Agreement
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                Savvey Savers Peer-to-Peer Contribution Platform
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.5 }}>
            To continue to your dashboard, please review and agree to the platform&apos;s updated terms of use and contribution rules.
          </p>
        </div>

        {/* Scrollable Terms Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '22px 28px',
            fontSize: '0.85rem',
            color: '#374151',
            lineHeight: 1.6,
            backgroundColor: '#FFFFFF'
          }}
        >
          {agreementHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: agreementHtml }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  1. Peer-to-Peer Savings & Commitments
                </h4>
                <p style={{ margin: 0 }}>
                  Savvey Savers is an invite-only platform connecting members who commit to save a pre-agreed amount monthly for a minimum cycle of 12 calendar months, disbursing the total saved amount interest-free as a harvest in each member&apos;s designated collection month.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  2. Contribution Schedule & Due Dates
                </h4>
                <p style={{ margin: 0 }}>
                  Monthly contribution payments are strictly due on or before the <strong>28th day</strong> of each calendar month. Members agree to make all monthly contributions throughout their 12-month commitment cycle, including after harvesting their payout.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  3. Default & Recovery Policy
                </h4>
                <p style={{ margin: 0 }}>
                  Late contributions beyond the due date may incur a late administration fee. In the event of default after harvesting savings, Savvey Savers reserves the right to initiate recovery actions and legal proceedings in accordance with English law, and the member will be liable for all recovery expenses incurred.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                  4. Confidentiality & Accurate Details
                </h4>
                <p style={{ margin: 0 }}>
                  Members must ensure their residential address and contact details remain accurate at all times. All member account details are maintained securely and confidentially.
                </p>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '18px',
              padding: '12px 14px',
              backgroundColor: '#FAF9F6',
              borderRadius: '10px',
              border: '1px solid #ECE8E2',
              fontSize: '0.8rem',
              color: '#6B7280'
            }}
          >
            You can read our full detailed policies at any time on our{' '}
            <a
              href="/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0c4e43', fontWeight: 600, textDecoration: 'underline' }}
            >
              Terms and Conditions
            </a>
            {', '}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0c4e43', fontWeight: 600, textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>
            {', and '}
            <a
              href="/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0c4e43', fontWeight: 600, textDecoration: 'underline' }}
            >
              Cookie Policy
            </a>{' '}
            pages.
          </div>
        </div>

        {/* Footer with Checkbox & Accept Button */}
        <div
          style={{
            padding: '20px 28px 24px',
            borderTop: '1px solid #ECE8E2',
            backgroundColor: '#FAF9F6',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontSize: '0.82rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: '#0c4e43',
                cursor: 'pointer',
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: '0.85rem', color: '#1F2937', fontWeight: 600, lineHeight: 1.4 }}>
              I have read, understood, and agree to the Savvey Savers Membership Agreement, Platform Rules, and Terms of Use.
            </span>
          </label>

          <button
            type="button"
            disabled={!agreed || isSubmitting}
            onClick={handleAcceptTerms}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: '12px',
              backgroundColor: agreed && !isSubmitting ? '#0c4e43' : '#9CA3AF',
              color: '#FFFFFF',
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              cursor: agreed && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: agreed ? '0 4px 12px rgba(12, 78, 67, 0.25)' : 'none'
            }}
          >
            {isSubmitting ? (
              <span>Saving Agreement...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Agree & Continue to Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
