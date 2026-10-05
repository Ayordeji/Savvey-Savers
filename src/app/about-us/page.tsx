'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileCheck,
  Clock,
  Scale,
} from 'lucide-react';

export default function AboutUsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

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
        activePath="/about-us"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* ============================================================ */}
        {/* 1. OUR STORY HERO (container 20e6860: #F4F1E8)              */}
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
              Our Story
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 3.8vw, 3.8rem)',
                fontWeight: 600,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.15,
                color: '#1A1A1A',
                margin: '0 0 20px 0',
                maxWidth: '900px',
              }}
            >
              More Than 12 Years of{' '}
              <span
                style={{
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  fontFamily: 'var(--font-family-title)',
                  fontWeight: 700,
                }}
              >
                Trusted{' '}
              </span>
              Community Saving
            </h1>
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.2vw, 1.2rem)',
                lineHeight: 1.7,
                color: '#4a4a4a',
                maxWidth: '780px',
                margin: 0,
              }}
            >
              What began as small, member-led savings circles has grown into a well-established network where individuals come together to support one another through disciplined saving and shared accountability.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. STATS BAR (container ecd52b6: #0E4F45)                    */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#0E4F45',
            color: '#FFFDFA',
            padding: '36px 80px',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              { num: '12+', text: 'Years of community savings cycles' },
              { num: '£2M+', text: 'In member savings allocations completed' },
              { num: '100+', text: 'Successful savings cycles' },
              { num: '40+', text: 'Active members across the UK' },
            ].map((stat, i) => (
              <div key={i}>
                <div
                  style={{
                    fontSize: 'clamp(2.4rem, 3.2vw, 3rem)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-title)',
                    lineHeight: 1.1,
                    marginBottom: '6px',
                    color: '#FFFDFA',
                  }}
                >
                  {stat.num}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#c5d6cc', lineHeight: 1.4 }}>
                  {stat.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. OUR PURPOSE (container a24f3c9: #F4F1E8)                 */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#F4F1E8',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.06em',
                  marginBottom: '10px',
                }}
              >
                Our Purpose
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3vw, 2.6rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.2,
                  color: '#1A1A1A',
                  margin: '0 0 18px 0',
                }}
              >
                A Community Savings Model That Actually Works
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: '#4a4a4a',
                  marginBottom: '24px',
                }}
              >
                We exist to provide a trusted, community-driven approach to achieving financial goals. By bringing members together in structured savings circles, Savvey helps individuals plan towards goals such as:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                {[
                  'Property deposits.',
                  'Education expenses.',
                  'Business capital.',
                  'Family financial planning.',
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={18} style={{ color: '#0E4F45', flexShrink: 0 }} />
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: '#4a4a4a',
                  margin: 0,
                }}
              >
                Through collective discipline and shared accountability, members support each other in reaching these milestones.
              </p>
            </div>

            <div>
              <div
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                }}
              >
                <img
                  src="/images/savings.webp"
                  alt="A Community Savings Model That Actually Works"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '480px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. CLARITY & TRANSPARENCY (container 2c3e67d: #FFFDFA)       */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#FFFDFA',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.06em',
                  marginBottom: '10px',
                }}
              >
                Clarity & Transparency
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  color: '#1A1A1A',
                  margin: '0 0 12px 0',
                }}
              >
                What Savvey Savers Does and Does Not Do
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#555',
                  maxWidth: '640px',
                  margin: '0 auto',
                }}
              >
                We offer a community-powered path to achieving financial milestones.
              </p>
            </div>

            {/* 2 Comparison Cards matching old design */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
              }}
            >
              {/* Card 1: What We Do */}
              <div
                style={{
                  backgroundColor: '#f7f5ec',
                  borderRadius: '20px',
                  padding: '40px',
                  border: '1px solid rgba(14, 79, 69, 0.15)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-title)',
                    color: '#0E4F45',
                    margin: '0 0 8px 0',
                  }}
                >
                  What We Do
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#777', marginBottom: '24px' }}>
                  Our role as facilitators
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    'Administrative coordination',
                    'Governance structures',
                    'Transparent contribution tracking',
                    'Clear savings schedules',
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} style={{ color: '#0E4F45', flexShrink: 0 }} />
                      <span style={{ fontSize: '1rem', color: '#1A1A1A', fontWeight: 500 }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    color: '#555',
                    margin: 0,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    paddingTop: '16px',
                  }}
                >
                  These frameworks help ensure clarity, accountability, and consistency within each savings circle.
                </p>
              </div>

              {/* Card 2: What We Do Not Do */}
              <div
                style={{
                  backgroundColor: '#f7f5ec',
                  borderRadius: '20px',
                  padding: '40px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-title)',
                    color: '#1A1A1A',
                    margin: '0 0 8px 0',
                  }}
                >
                  What We Do Not Do
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#777', marginBottom: '24px' }}>
                  We are not a bank or lender
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    'Loans',
                    'Banking services',
                    'Investment products',
                    'Financial advice',
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <XCircle size={18} style={{ color: '#A46A3F', flexShrink: 0 }} />
                      <span style={{ fontSize: '1rem', color: '#1A1A1A', fontWeight: 500 }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p
                  style={{
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    color: '#555',
                    margin: 0,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    paddingTop: '16px',
                  }}
                >
                  Savvey serves solely as the administrative and governance facilitator for member-driven savings circles. Participation is based on shared responsibility among members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. GOVERNANCE (container 0d5729d: #F4F1E8)                   */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#F4F1E8',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.06em',
                  marginBottom: '10px',
                }}
              >
                Governance
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  color: '#1A1A1A',
                  margin: '0 0 12px 0',
                }}
              >
                Built on Safeguards That Protect Every Member
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#555',
                  maxWidth: '640px',
                  margin: '0 auto',
                }}
              >
                These measures help maintain trust, accountability, and transparency across the collective:
              </p>
            </div>

            {/* 4 Safeguard Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                {
                  icon: ShieldCheck,
                  title: 'Member Verification',
                  desc: 'All members undergo checks before joining any circle.',
                },
                {
                  icon: FileCheck,
                  title: 'Transparent Tracking',
                  desc: 'Contributions are tracked openly throughout each cycle.',
                },
                {
                  icon: Clock,
                  title: 'Defined Cycles',
                  desc: 'Clearly structured timelines and disbursement schedules.',
                },
                {
                  icon: Scale,
                  title: 'Dispute Resolution',
                  desc: 'A fair process for addressing any issues that arise.',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFDFA',
                    borderRadius: '16px',
                    padding: '32px 24px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      backgroundColor: '#0E4F45',
                      color: '#FFFDFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <card.icon size={26} />
                  </div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-family-title)',
                      color: '#1A1A1A',
                      margin: '0 0 10px 0',
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.925rem',
                      lineHeight: 1.6,
                      color: '#555',
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. CTA BANNER (container c1e859e)                            */}
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
                maxWidth: '520px',
              }}
            >
              Communities Building Sustainable Wealth Together
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
              Experience the power of disciplined community saving. Join a vetted savings circle today.
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
