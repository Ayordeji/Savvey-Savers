'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import { PlusCircle, MinusCircle } from 'lucide-react';

export default function FaqsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const faqItems = [
    {
      q: 'What is Savvey Savers Collective?',
      a: 'Savvey Savers Collective is a structured, referral-based savings network where members participate in trusted savings cycles. Members make regular contributions and receive pooled contributions in their assigned month. The collective is designed to support members in achieving financial goals through shared accountability and disciplined saving.',
    },
    {
      q: 'How do savings cycles work?',
      a: 'Members join a vetted cycle with a fixed monthly contribution. Each month, one member receives the pooled contributions according to a pre-agreed schedule. The cycle continues until all members have received their scheduled disbursement. Savvey Savers administers the process but does not hold or manage member funds.',
    },
    {
      q: 'Who can join the Collective?',
      a: 'Membership is currently open to UK residents and is by referral and approval only. This approach helps maintain trust, accountability, and the integrity of each savings cycle.',
    },
    {
      q: 'Can members invite others?',
      a: 'Yes. Members may refer trusted friends, family, or colleagues. All referrals undergo verification and approval before joining a savings cycle.',
    },
    {
      q: 'How are members verified?',
      a: 'We conduct onboarding and verification checks to confirm eligibility and to help ensure that all members uphold the trust and shared responsibility that underpin the collective.',
    },
    {
      q: 'What happens if a member misses a contribution?',
      a: 'Savings cycles operate on shared accountability. If a contribution is missed, our governance process is activated to address the situation and support the continuation of the cycle in a fair and transparent manner.',
    },
    {
      q: 'Are there fees to join or participate?',
      a: 'Savvey Savers facilitates administrative coordination and governance. Any administrative or membership platform fees are transparently communicated to members prior to cycle initiation with no hidden charges.',
    },
    {
      q: 'Can I change my monthly contribution amount?',
      a: 'Contribution amounts may be adjusted before a new cycle begins, provided there is a cycle with matching contribution levels. Once a cycle has started, contribution amounts cannot be changed.',
    },
    {
      q: 'How are payout months assigned?',
      a: 'Disbursement months are agreed at the start of each cycle to ensure transparency and fairness for all members.',
    },
    {
      q: 'Does Savvey Savers provide loans or financial services?',
      a: 'No. Savvey Savers Collective facilitates structured savings cycles. We do not provide loans, banking services, or regulated investment products.',
    },
    {
      q: 'How is my data protected?',
      a: 'We protect personal data in accordance with GDPR and applicable data protection laws. Personal information is used only for administration, verification, and communication related to the collective.',
    },
  ];

  const toggleAccordion = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFDFA',
        fontFamily: 'var(--font-family-body)',
        color: '#1A1A1A',
      }}
    >
      <MarketingHeader
        activePath="/faqs"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* ============================================================ */}
        {/* 1. FAQS HERO (container: #F4F1E8)                           */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#F4F1E8',
            padding: '80px 80px 70px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontStyle: 'italic',
                color: '#0E4F45',
                letterSpacing: '0.06em',
                marginBottom: '14px',
              }}
            >
              You ask we answer
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 3.8vw, 3.8rem)',
                fontWeight: 600,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.15,
                color: '#1A1A1A',
                margin: '0 0 20px 0',
              }}
            >
              Frequently Asked Questions
            </h1>
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.2vw, 1.2rem)',
                lineHeight: 1.7,
                color: '#4a4a4a',
                maxWidth: '700px',
                margin: 0,
              }}
            >
              Everything you need to know about Savvey Savers Collective. Can’t find what you are looking for?{' '}
              <a
                href="mailto:Support@SavveySaver.com"
                style={{ color: '#0E4F45', fontWeight: 600, textDecoration: 'underline' }}
              >
                Contact us
              </a>
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. FAQS ACCORDION (#FFFDFA matching WordPress)               */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#FFFDFA',
            padding: '80px 80px 100px',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '960px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {faqItems.map((item, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#F4F1E8',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    style={{
                      width: '100%',
                      padding: '24px 28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '20px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-family-title)',
                        color: isOpen ? '#0E4F45' : '#1A1A1A',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.q}
                    </span>
                    <span style={{ color: '#0E4F45', flexShrink: 0 }}>
                      {isOpen ? <MinusCircle size={24} /> : <PlusCircle size={24} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 28px 24px',
                        color: '#4a4a4a',
                        fontSize: '1rem',
                        lineHeight: 1.7,
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. CTA BANNER                                                */}
        {/* ============================================================ */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            minHeight: '480px',
            backgroundColor: '#0E4F45',
          }}
        >
          <div
            style={{
              backgroundImage: 'url(/images/holding-hands.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '360px',
            }}
          />

          <div
            style={{
              backgroundColor: '#0E4F45',
              color: '#FFFDFA',
              padding: '60px 48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                fontWeight: 600,
                fontFamily: 'var(--font-family-title)',
                color: '#FFFDFA',
                margin: '0 0 16px 0',
              }}
            >
              Start your journey
            </h3>
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: '#e2ede5',
                maxWidth: '460px',
                margin: '0 0 28px 0',
              }}
            >
              Witness the transformative power of collective financial strength. Welcome to a community where your dreams matter, and together, we make them a reality.
            </p>
            <button
              onClick={() => setWaitlistModalOpen(true)}
              style={{
                backgroundColor: '#FFFDFA',
                color: '#0E4F45',
                border: 'none',
                padding: '14px 34px',
                borderRadius: '360px',
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: 'var(--font-family-title)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F1E8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFDFA')}
            >
              Join Waiting List
            </button>
          </div>
        </section>
      </main>

      <MarketingFooter
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />

      <style jsx>{`
        @media (max-width: 900px) {
          .responsive-section-padding {
            padding: 50px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
