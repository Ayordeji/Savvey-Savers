'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Users,
  Coins,
  CalendarCheck,
  TrendingUp,
  Building,
  GraduationCap,
  Briefcase,
  Globe2,
  HeartHandshake,
  Star,
  Lock,
  ChevronRight,
} from 'lucide-react';

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  // Check if already logged in -> redirect to dashboard
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          window.location.href = '/dashboard';
        }
      })
      .catch((err) => console.error('Session verify error:', err));
  }, []);

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
        activePath="/"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* ============================================================ */}
        {/* SECTION 1: HERO SECTION                                      */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '60px 24px 80px',
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Copy & CTAs */}
          <div>
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(12, 78, 67, 0.08)',
                border: '1px solid rgba(12, 78, 67, 0.18)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              <ShieldCheck size={16} />
              <span>UK RESIDENTS ONLY, BY REFERRAL & APPROVAL</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.12,
                color: 'var(--text-main)',
                margin: '0 0 20px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Build Wealth Through a{' '}
              <span style={{ color: 'var(--primary)', position: 'relative' }}>
                Trusted Savings Community
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)',
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                marginBottom: '32px',
                maxWidth: '560px',
              }}
            >
              A structured, referral-based savings collective that enables members to work towards property ownership and other major life goals, including education, through a trusted, interest-free community saving model.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                alignItems: 'center',
                marginBottom: '36px',
              }}
            >
              <button
                onClick={() => setWaitlistModalOpen(true)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--secondary)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-family-title)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 18px var(--secondary-glow)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--secondary-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Join the Waiting List</span>
                <ArrowRight size={18} />
              </button>

              <Link
                href="/about-us"
                style={{
                  padding: '13px 26px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-family-title)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <span>Learn More</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Trust Checkmarks */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))',
                gap: '12px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {[
                'Vetted members',
                'Structured governance',
                'Transparent tracking',
                'GDPR-Compliant',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Graphic with Floating Badges */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(12, 78, 67, 0.25)',
                border: '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              <img
                src="/images/hero-image.webp"
                alt="Savvey Savers Community and Wealth Building"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '520px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>

            {/* Floating Badge 1: 12+ Years Impact */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '-16px',
                backgroundColor: '#ffffff',
                padding: '12px 18px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)' }}>
                  12+ Years
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Impact & Trust
                </span>
              </div>
            </div>

            {/* Floating Badge 2: Governed Circles */}
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '-16px',
                backgroundColor: '#ffffff',
                padding: '12px 18px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--secondary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--secondary)',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--secondary)' }}>
                  Governed Circles
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Transparent Tracking
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: HOW THE COLLECTIVE WORKS                         */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '80px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                The Process
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  color: 'var(--text-main)',
                  margin: '0 0 12px 0',
                }}
              >
                How the Collective Works
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-muted)',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                Four simple steps to achieving your financial goals through community savings.
              </p>
            </div>

            {/* 4 Steps Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                {
                  step: '01',
                  icon: Users,
                  title: 'Join a Vetted Circle',
                  desc: 'Members are verified and placed into trusted savings circles through referrals and onboarding checks.',
                },
                {
                  step: '02',
                  icon: Coins,
                  title: 'Contribute Monthly',
                  desc: 'Members make structured monthly contributions that are tracked transparently on the member portal.',
                },
                {
                  step: '03',
                  icon: CalendarCheck,
                  title: 'Receive Scheduled Disbursement',
                  desc: 'Members receive pooled contributions in their assigned month according to the pre-agreed schedule.',
                },
                {
                  step: '04',
                  icon: HeartHandshake,
                  title: 'Collective Accountability',
                  desc: 'Ongoing contributions ensure every member completes their cycle and reaches their major financial goal.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px 24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '24px',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-family-title)',
                      color: 'var(--border-color)',
                    }}
                  >
                    {item.step}
                  </span>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      marginBottom: '20px',
                    }}
                  >
                    <item.icon size={24} />
                  </div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-family-title)',
                      color: 'var(--text-main)',
                      margin: '0 0 10px 0',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'var(--text-muted)',
                      margin: 0,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: BUILT ON TRUST                                    */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '90px 24px',
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px',
            alignItems: 'center',
          }}
        >
          {/* Side Image */}
          <div style={{ order: 2 }}>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-color)',
              }}
            >
              <img
                src="/images/savings.webp"
                alt="Savings Safeguards & Governance"
                style={{
                  width: '100%',
                  height: '460px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Checklist Content */}
          <div style={{ order: 1 }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--secondary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Integrity & Governance
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.2,
                color: 'var(--text-main)',
                margin: '0 0 16px 0',
              }}
            >
              Built on Trust. Sustained by Shared Accountability.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                marginBottom: '28px',
              }}
            >
              Savvey Savers facilitates and administers savings circles but does not hold or manage member funds. We safeguard member contributions through structured governance, transparent processes, and secure data practices designed to protect the integrity of every savings circle.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              {[
                'Strict member verification protocols',
                'Verified onboarding process',
                'Structured disbursement schedules',
                'Transparent contribution tracking',
                'Clear dispute resolution processes',
                'GDPR-aligned data protection',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWaitlistModalOpen(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Apply for Vetted Membership</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: WHY MEMBERS JOIN SAVVEY SAVERS                   */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '80px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--secondary)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Financial Milestones
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  color: 'var(--text-main)',
                  margin: '0 0 12px 0',
                }}
              >
                Why Members Join Savvey Savers Collective
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                  maxWidth: '650px',
                  margin: '0 auto',
                }}
              >
                Members utilize interest-free pooled disbursements to reach life-changing financial goals.
              </p>
            </div>

            {/* 5 Goal Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
              }}
            >
              {[
                {
                  icon: Building,
                  title: 'Property Deposits',
                  desc: 'Accumulate lump-sum equity for home purchases and mortgage deposits without commercial borrowing.',
                },
                {
                  icon: GraduationCap,
                  title: 'Education Expenses',
                  desc: 'Fund university tuition fees, career bootcamps, and professional development debt-free.',
                },
                {
                  icon: Briefcase,
                  title: 'Business Capital',
                  desc: 'Bootstrap startup inventory, scale company equipment, and secure working capital.',
                },
                {
                  icon: Globe2,
                  title: 'Diaspora Wealth Planning',
                  desc: 'Coordinate international investments, home country development, and long-term asset accumulation.',
                },
                {
                  icon: Users,
                  title: 'Family Financial Planning',
                  desc: 'Achieve significant milestones, life events, and family financial stability through collective discipline.',
                },
              ].map((goal, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    padding: '28px 22px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--secondary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--secondary)',
                        marginBottom: '16px',
                      }}
                    >
                      <goal.icon size={22} />
                    </div>
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-family-title)',
                        color: 'var(--text-main)',
                        margin: '0 0 10px 0',
                      }}
                    >
                      {goal.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        lineHeight: 1.55,
                        color: 'var(--text-muted)',
                        margin: 0,
                      }}
                    >
                      {goal.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: WHY SAVVEY SAVERS COLLECTIVE                     */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '90px 24px',
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px',
            alignItems: 'center',
          }}
        >
          {/* Left: Differentiators */}
          <div>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--primary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              The Savvey Advantage
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.2,
                color: 'var(--text-main)',
                margin: '0 0 16px 0',
              }}
            >
              Why Savvey Savers Collective
            </h2>
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                marginBottom: '28px',
              }}
            >
              We offer a structured community-driven alternative to traditional borrowing, built on shared trust and collective responsibility.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {[
                { title: 'Achieve property deposit goals faster', desc: 'Accelerate timelines through scheduled pooled payouts.' },
                { title: 'Receive pooled funds without borrowing', desc: 'Access capital that is 100% interest-free.' },
                { title: 'No interest. No hidden fees', desc: 'Simple, transparent, zero hidden charges or penalty surcharges.' },
                { title: 'Build lasting financial discipline', desc: 'Structured peer accountability fosters consistent monthly habits.' },
                { title: 'A structured alternative to commercial credit', desc: 'Community empowerment replacing predatory debt.' },
              ].map((diff, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--status-active-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {diff.title}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {diff.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWaitlistModalOpen(true)}
              style={{
                padding: '13px 26px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--secondary)',
                color: '#ffffff',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px var(--secondary-glow)',
              }}
            >
              <span>Join a Savings Circle</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right: Community Image */}
          <div>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-color)',
              }}
            >
              <img
                src="/images/community.webp"
                alt="Savvey Savers Collective Alternative"
                style={{
                  width: '100%',
                  height: '460px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: MEMBER TESTIMONIALS (GOOGLE REVIEWS)             */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '80px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Member Testimonials
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  color: 'var(--text-main)',
                  margin: '0 0 12px 0',
                }}
              >
                Real Impact, Real Communities
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                  maxWidth: '600px',
                  margin: '0 auto 24px',
                }}
              >
                What our verified members say about saving with the collective on Google Reviews.
              </p>

              {/* Google Reviews Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', gap: '3px', color: '#f59e0b' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="#f59e0b" />
                  ))}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  5.0 Rating on Google Reviews
                </span>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Savvey Savers Network Limited
                </span>
              </div>
            </div>

            {/* Testimonials Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                {
                  name: 'Judy Dominic',
                  time: '2 years ago',
                  quote:
                    'My 1 years collection has just been deposited in my account.. yay!. This approach encourages financial discipline and helps me achieve my financial objectives faster. Highly recommend.',
                },
                {
                  name: 'oronsaye Daniel',
                  time: '2 years ago',
                  quote:
                    'A very trusted and reliable saving club, I couldn’t have achieved my saving goals if not for savvey savers . Many thanks to the dedicated minds behind this great platform.',
                },
                {
                  name: 'Yori Gbadamosi',
                  time: '3 years ago',
                  quote:
                    'Savvey Savers Network Limited offers a range of savings solutions with transparent terms. Their excellent customer service, user-friendly online platform, transparent fee structures, and commitment to security make them a reliable choice.',
                },
                {
                  name: 'Simisola Adingupu',
                  time: '1 year ago',
                  quote:
                    'Started using savvy savers this year, just received my first half payment. I totally recommend.',
                },
                {
                  name: 'olowo busola',
                  time: '11 months ago',
                  quote:
                    'Well organised...I have no regrets joining this group. Very transparent ledger and reliable disbursement.',
                },
                {
                  name: 'Davidson Sunday',
                  time: '2 years ago',
                  quote:
                    'It is so lovely and no stress, so Compliance and structured from start to finish.',
                },
              ].map((rev, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '28px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.925rem',
                      lineHeight: 1.65,
                      color: 'var(--text-main)',
                      margin: '0 0 20px 0',
                      fontStyle: 'italic',
                    }}
                  >
                    "{rev.quote}"
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)' }}>
                        {rev.name}
                      </strong>
                      <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {rev.time} · Google Verified Review
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: FINAL CTA BANNER                                  */}
        {/* ============================================================ */}
        <section
          style={{
            padding: '80px 24px',
            backgroundColor: 'var(--primary-dark)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                marginBottom: '16px',
              }}
            >
              Start Your Journey with Savvey Savers
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#c5d6cc',
                lineHeight: 1.65,
                marginBottom: '32px',
              }}
            >
              Take control of your savings goals today. Join a community of disciplined savers working together towards home deposits, education, and long-term wealth.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setWaitlistModalOpen(true)}
                style={{
                  padding: '15px 32px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--secondary)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-family-title)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px var(--secondary-glow)',
                }}
              >
                <span>Join Our Waiting List</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      {/* Interactive Modals */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />
    </div>
  );
}
