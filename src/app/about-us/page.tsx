'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import {
  Check,
  CheckCircle2,
  XCircle,
  Settings,
  Ban,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  Scale,
} from 'lucide-react';

export default function AboutUsPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  return (
    <div
      className="marketing-page-wrapper"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFDFA',
        fontFamily: 'var(--font-family-body)',
        color: '#1A1A1A',
        width: '100%',
        margin: 0,
        padding: 0,
      }}
    >
      <MarketingHeader
        activePath="/about-us"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main className="marketing-main" style={{ flex: 1, padding: 0, margin: 0, width: '100%' }}>
        {/* ============================================================ */}
        {/* 1. OUR STORY HERO (container 20e6860: #F4F1E8)              */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#F4F1E8',
            padding: '80px 80px',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Story Text */}
            <div>
              <div
                style={{
                  fontSize: 'clamp(0.8rem, 0.8vw, 0.875rem)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                }}
              >
                Our Story
              </div>
              <h1
                style={{
                  fontSize: 'clamp(2.35rem, 3.5vw, 3.2rem)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.2,
                  color: '#1A1A1A',
                  margin: '0 0 24px 0',
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
                  margin: 0,
                }}
              >
                What began with a handful of friends who wanted to to build a disciplined approach to saving has grown into a  well-established network, with individuals across the UK coming together to support one another through disciplined saving and shared accountability.
              </p>

              {/* 4 Trust Pills matching previous site */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '32px',
                }}
              >
                {[
                  'UK Residents Only',
                  'Referral-Based',
                  'Interest-Free',
                  'GDPR Aligned',
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1.5px solid #0E4F45',
                      borderRadius: '360px',
                      padding: '8px 20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0E4F45',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} style={{ color: '#0E4F45', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Hero Image (Width 80% container on desktop) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                }}
              >
                <img
                  src="/images/about_hero.webp"
                  alt="Savvey Savers Community Saving"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '32px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. STATS BAR (container ecd52b6: #0E4F45)                    */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#0E4F45',
            color: '#FFFDFA',
            padding: '24px 120px',
          }}
          className="responsive-stats-padding"
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              textAlign: 'center',
            }}
          >
            {[
              { num: '12+', text: 'Years of community savings cycles' },
              { num: '£2M+', text: 'In member savings allocations completed' },
              { num: '100+', text: 'Successful savings cycles' },
              { num: '40+', text: 'Active members across the UK' },
            ].map((stat, i) => (
              <div key={i} style={{ padding: '8px 12px' }}>
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
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: '#c5d6cc',
                    lineHeight: 1.4,
                  }}
                >
                  {stat.text}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. OUR PURPOSE (container a24f3c9: #FFFDFA)                 */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#FFFDFA',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Image */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                }}
              >
                <img
                  src="/images/about_story.webp"
                  alt="A Community Savings Model That Actually Works"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '32px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>

            {/* Right Column: Purpose Text & Checklist */}
            <div>
              <div
                style={{
                  fontSize: 'clamp(0.8rem, 0.8vw, 0.875rem)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                }}
              >
                Our Purpose
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.65rem, 2.4vw, 2.25rem)',
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
                  marginBottom: '16px',
                }}
              >
                We exist to provide a trusted, community-driven approach to achieving financial goals.
              </p>

              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: '#4a4a4a',
                  marginBottom: '24px',
                }}
              >
                By bringing members together in structured savings cycles, being a part of the Collective helps members plan towards goals such as:
              </p>

              {/* 2-column checklist matching elementor layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px 24px',
                  marginBottom: '26px',
                }}
              >
                {[
                  'Property deposits',
                  'Education expenses',
                  'Business capital',
                  'Family financial planning',
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} style={{ color: '#0E4F45', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1A1A1A' }}>
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
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. CLARITY & TRANSPARENCY (container 2c3e67d: #F4F1E8)       */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#F4F1E8',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div
                style={{
                  fontSize: 'clamp(0.8rem, 0.8vw, 0.875rem)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
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
                  margin: '0 0 14px 0',
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
                className="comparison-card"
                style={{
                  backgroundColor: '#FFFDFA',
                  borderRadius: '16px',
                  padding: '36px',
                  border: '2px solid rgba(14, 79, 69, 0.33)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Header Row: circular icon badge + title & subtitle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#0E4F45',
                        color: '#FFFDFA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Settings size={24} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-family-title)',
                          color: '#0E4F45',
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        What We Do
                      </h3>
                      <div style={{ fontSize: '0.925rem', color: '#666', marginTop: '4px' }}>
                        Our role as facilitators
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                    {[
                      'Administrative coordination',
                      'Governance structures',
                      'Transparent contribution tracking',
                      'Clear savings schedules',
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle2 size={18} style={{ color: '#0E4F45', flexShrink: 0 }} />
                        <span style={{ fontSize: '1rem', color: '#1A1A1A', fontWeight: 500 }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    color: '#555',
                    margin: 0,
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    paddingTop: '20px',
                  }}
                >
                  These frameworks help ensure clarity, accountability, and consistency within each savings cycle.
                </p>
              </div>

              {/* Card 2: What We Do Not Do */}
              <div
                className="comparison-card"
                style={{
                  backgroundColor: '#FFFDFA',
                  borderRadius: '16px',
                  padding: '36px',
                  border: '2px solid rgba(14, 79, 69, 0.33)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Header Row: circular icon badge + title & subtitle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#A46A3F',
                        color: '#FFFDFA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Ban size={24} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-family-title)',
                          color: '#1A1A1A',
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        What We Do Not Do
                      </h3>
                      <div style={{ fontSize: '0.925rem', color: '#666', marginTop: '4px' }}>
                        We are not a bank or lender
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                    {[
                      'Loans',
                      'Banking services',
                      'Investment products',
                      'Financial advice',
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <XCircle size={18} style={{ color: '#A46A3F', flexShrink: 0 }} />
                        <span style={{ fontSize: '1rem', color: '#1A1A1A', fontWeight: 500 }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                    color: '#555',
                    margin: 0,
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    paddingTop: '20px',
                  }}
                >
                  Savvey Savers serves solely as the administrative and governance facilitator for member-driven savings cycles. Participation is based on shared responsibility among members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. GOVERNANCE (container 0d5729d: #FFFDFA)                   */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#FFFDFA',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Heading, intro, and 2x2 grid of safeguard cards */}
            <div>
              <div
                style={{
                  fontSize: 'clamp(0.8rem, 0.8vw, 0.875rem)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                }}
              >
                Governance
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.2,
                  color: '#1A1A1A',
                  margin: '0 0 16px 0',
                }}
              >
                Built on Safeguards That Protect Every Member
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#555',
                  lineHeight: 1.65,
                  marginBottom: '32px',
                }}
              >
                These measures help maintain trust, accountability, and transparency across the collective:
              </p>

              {/* 2x2 Grid of 4 Safeguard Cards with icons matching original layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                }}
              >
                {[
                  {
                    icon: UserCheck,
                    title: 'Member Verification',
                    desc: 'All members undergo checks before joining any cycle.',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Transparent Tracking',
                    desc: 'Contributions are tracked openly throughout each cycle.',
                  },
                  {
                    icon: CalendarCheck,
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
                    className="safeguard-card"
                    style={{
                      backgroundColor: '#FFFDFA',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      border: '2px solid rgba(14, 79, 69, 0.33)',
                      transition: 'border-color 0.3s ease, transform 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                    }}
                  >
                    <div style={{ color: '#0E4F45', flexShrink: 0, marginTop: '2px' }}>
                      <card.icon size={22} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-family-title)',
                          color: '#1A1A1A',
                          margin: '0 0 4px 0',
                          lineHeight: 1.25,
                        }}
                      >
                        {card.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          color: '#555',
                          margin: 0,
                        }}
                      >
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Governance Image (centered, width 85% container) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                }}
              >
                <img
                  src="/images/about_governance.webp"
                  alt="Built on Safeguards That Protect Every Member"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '32px',
                    objectFit: 'cover',
                  }}
                />
              </div>
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
                fontSize: 'clamp(1.35rem, 1.8vw, 1.75rem)',
                fontWeight: 600,
                fontFamily: 'var(--font-family-title)',
                color: '#FFFDFA',
                margin: '0 0 16px 0',
                maxWidth: '520px',
                lineHeight: 1.25,
              }}
            >
              Communities Building Sustainable Wealth Together
            </h3>
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: '#FFFDFA',
                maxWidth: '480px',
                margin: '0 0 28px 0',
                opacity: 0.95,
              }}
            >
              We envision a future where trust, discipline and shared financial responsibility becomes the foundation for wealth building, empowering members to achieve long term stability through collective strength.
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F4F1E8';
                e.currentTarget.style.color = '#0E4F45F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFDFA';
                e.currentTarget.style.color = '#0E4F45';
              }}
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
        .comparison-card:hover {
          border-color: #0E4F45 !important;
          box-shadow: 0 12px 30px rgba(14, 79, 69, 0.08);
        }
        .safeguard-card:hover {
          border-color: #0E4F45 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(14, 79, 69, 0.06);
        }
        @media (max-width: 900px) {
          .responsive-section-padding {
            padding: 40px 16px !important;
          }
          .responsive-stats-padding {
            padding: 24px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
