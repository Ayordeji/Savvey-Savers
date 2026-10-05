'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import { HelpCircle, ChevronDown, Mail, ArrowRight, MessageCircle } from 'lucide-react';

export default function FaqsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // First item open by default

  const faqItems = [
    {
      q: 'What is Savvey Savers Collective?',
      a: 'Savvey Savers Collective is a structured, referral-based savings network where members participate in trusted savings circles. Members make regular contributions and receive pooled contributions in their assigned month. The collective is designed to support members in achieving financial goals through shared accountability and disciplined saving.',
    },
    {
      q: 'How do savings circles work?',
      a: 'Members join a vetted circle with a fixed monthly contribution. Each month, one member receives the pooled contributions according to a pre-agreed schedule. The cycle continues until all members have received their scheduled disbursement. Savvey Savers administers the process but does not hold or manage member funds.',
    },
    {
      q: 'Who can join the Collective?',
      a: 'Membership is currently open to UK residents and is by referral and approval only. This approach helps maintain trust, accountability, and the integrity of each savings circle.',
    },
    {
      q: 'Can members invite others?',
      a: 'Yes. Members may refer trusted friends, family, or colleagues. All referrals undergo verification and approval before joining a savings circle.',
    },
    {
      q: 'How are members verified?',
      a: 'We conduct onboarding and verification checks to confirm eligibility and to help ensure that all members uphold the trust and shared responsibility that underpin the collective.',
    },
    {
      q: 'What happens if a member misses a contribution?',
      a: 'Savings circles operate on shared accountability. If a contribution is missed, our governance process is activated to address the situation and support the continuation of the cycle in a fair and transparent manner.',
    },
    {
      q: 'Are there fees to join or participate?',
      a: 'Savvey Savers facilitates administrative coordination and governance. Any administrative or membership platform fees are transparently communicated to members prior to circle initiation with no hidden charges.',
    },
    {
      q: 'Can I change my monthly contribution amount?',
      a: 'Contribution amounts may be adjusted before a new cycle begins, provided there is a circle with matching contribution levels. Once a cycle has started, contribution amounts cannot be changed.',
    },
    {
      q: 'How are payout months assigned?',
      a: 'Disbursement months are agreed at the start of each cycle to ensure transparency and fairness for all members.',
    },
    {
      q: 'Does Savvey Savers provide loans or financial services?',
      a: 'No. Savvey Savers Collective facilitates structured savings circles. We do not provide loans, banking services, or regulated investment products.',
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
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'var(--font-family-body)',
        color: 'var(--text-main)',
      }}
    >
      <MarketingHeader
        activePath="/faqs"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section
          style={{
            padding: '70px 24px 50px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#e2ede5',
                fontSize: '0.8125rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}
            >
              <HelpCircle size={16} />
              <span>You Ask, We Answer</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.15,
                margin: '0 0 16px 0',
              }}
            >
              Frequently Asked Questions
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
                lineHeight: 1.6,
                color: '#c5d6cc',
                margin: '0 auto',
                maxWidth: '620px',
              }}
            >
              Everything you need to know about Savvey Savers Collective, our vetted circles, monthly allocations, and governance framework.
            </p>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section
          style={{
            padding: '60px 24px 80px',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqItems.map((item, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-family-title)',
                        color: isOpen ? 'var(--primary)' : 'var(--text-main)',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isOpen ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isOpen ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease, background-color 0.2s',
                      }}
                    >
                      <ChevronDown size={18} />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 22px',
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '16px',
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Need help card */}
          <div
            style={{
              marginTop: '48px',
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px dashed var(--border-color)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Mail size={22} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                fontFamily: 'var(--font-family-title)',
              }}
            >
              Can't find what you are looking for?
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.925rem',
                color: 'var(--text-muted)',
                maxWidth: '460px',
              }}
            >
              Our governance and member administration team is here to answer any questions about circle setup, verification, or community guidelines.
            </p>
            <a
              href="mailto:Support@SavveySaver.com"
              style={{
                marginTop: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <span>Contact Support Team</span>
              <ArrowRight size={15} />
            </a>
          </div>
        </section>
      </main>

      <MarketingFooter
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />
    </div>
  );
}
