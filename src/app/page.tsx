'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import {
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Star,
  Users,
  Coins,
  CalendarCheck,
  HeartHandshake,
  Home as HomeIcon,
  GraduationCap,
  Briefcase,
  Globe2,
  Users2,
  ShieldCheck,
  Bookmark,
  CheckCircle,
  Building,
  Shield,
} from 'lucide-react';

export default function HomePage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

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
        backgroundColor: '#FFFDFA',
        fontFamily: 'var(--font-family-body)',
        color: '#1A1A1A',
      }}
    >
      <MarketingHeader
        activePath="/"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* ============================================================ */}
        {/* 1. HERO SECTION (background: #F4F1E8)                        */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#F4F1E8',
            padding: '70px 80px 80px',
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
            {/* Left Column: Copy & Actions */}
            <div>
              {/* Top Kicker matching old design */}
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#0E4F45',
                  letterSpacing: '0.06em',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-family-body)',
                }}
              >
                UK RESIDENTS ONLY, BY REFERRAL & APPROVAL
              </div>

              {/* Headline matching old design */}
              <h1
                style={{
                  fontSize: 'clamp(2.4rem, 3.8vw, 3.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.15,
                  color: '#1A1A1A',
                  margin: '0 0 24px 0',
                  letterSpacing: '-0.02em',
                }}
              >
                Build Wealth Through a <br className="hidden-mobile" />
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
                Savings Community
              </h1>

              {/* Description */}
              <p
                style={{
                  fontSize: 'clamp(1rem, 1.15vw, 1.15rem)',
                  lineHeight: 1.7,
                  color: '#4a4a4a',
                  marginBottom: '36px',
                  maxWidth: '580px',
                }}
              >
                A structured, referral-based savings collective that enables members to work towards property ownership and other major life goals, including education, through a trusted, interest-free community saving model.
              </p>

              {/* Action Buttons (exact pills) */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  alignItems: 'center',
                  marginBottom: '36px',
                }}
              >
                <button
                  onClick={() => setWaitlistModalOpen(true)}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '360px',
                    border: '2px solid #0E4F45',
                    backgroundColor: '#0E4F45',
                    color: '#FFFDFA',
                    fontFamily: 'var(--font-family-title)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0E4F45F2';
                    e.currentTarget.style.borderColor = '#0E4F45F2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0E4F45';
                    e.currentTarget.style.borderColor = '#0E4F45';
                  }}
                >
                  <span>Join the Waiting List</span>
                  <ArrowRight size={16} />
                </button>

                <Link
                  href="/about-us"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '360px',
                    border: '2px solid #1A1A1A',
                    backgroundColor: 'transparent',
                    color: '#1A1A1A',
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
                    e.currentTarget.style.backgroundColor = '#1A1A1A';
                    e.currentTarget.style.color = '#FFFDFA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1A1A1A';
                  }}
                >
                  <span>Learn More</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* 4 Trust Points (Pills matching old design) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  maxWidth: '520px',
                }}
              >
                {[
                  'Vetted members',
                  'Structured governance',
                  'Transparent tracking',
                  'GDPR-Compliant',
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#FFFDFA',
                      border: '1px solid rgba(14, 79, 69, 0.15)',
                      borderRadius: '360px',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1A1A1A',
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: '#0E4F45', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Hero Image matching old design */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                }}
              >
                <img
                  src="/images/hero-image.webp"
                  alt="Build Wealth Through a Trusted Savings Community"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '540px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. DARK GREEN HORIZONTAL TRUST STRIP (container ecd52b6)     */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#0E4F45',
            color: '#FFFDFA',
            padding: '22px 80px',
            overflowX: 'auto',
          }}
          className="responsive-section-padding"
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: '12+ Years Impact', icon: CheckCircle },
              { label: 'Governed Circles', icon: Bookmark },
              { label: 'Verified Members', icon: CheckCircle2 },
              { label: 'GDPR Protection', icon: ShieldCheck },
              { label: 'Structured governance', icon: Building },
              { label: 'GDPR-Compliant', icon: Shield },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <item.icon size={18} style={{ color: '#FFBC7D' }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. HOW THE COLLECTIVE WORKS (container 8d72461: #FFFDFA)     */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#FFFDFA',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  color: '#1A1A1A',
                  margin: '0 0 14px 0',
                }}
              >
                How the Collective Works
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#555',
                  maxWidth: '640px',
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                Four simple steps to achieving your financial goals through community savings.
              </p>
            </div>

            {/* 4 Step Icon Boxes with connecting line */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '32px',
                position: 'relative',
              }}
              className="steps-container"
            >
              {[
                {
                  icon: Users,
                  title: 'Join a Vetted Circle',
                  desc: 'Members are verified and placed into trusted savings circles through referrals and onboarding checks.',
                },
                {
                  icon: Coins,
                  title: 'Contribute Monthly',
                  desc: 'Members make structured monthly contributions that are tracked transparently.',
                },
                {
                  icon: CalendarCheck,
                  title: 'Receive Scheduled Disbursement',
                  desc: 'Members receive pooled contributions in their assigned month.',
                },
                {
                  icon: HeartHandshake,
                  title: 'Collective Accountability',
                  desc: 'Ongoing contributions ensure every member completes their cycle and reaches their goal.',
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Circular Step Icon */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#0E4F45',
                      color: '#FFFDFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      boxShadow: '0 6px 16px rgba(14, 79, 69, 0.25)',
                    }}
                  >
                    <step.icon size={28} />
                  </div>

                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-family-title)',
                      color: '#1A1A1A',
                      margin: '0 0 12px 0',
                    }}
                  >
                    {step.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.9375rem',
                      lineHeight: 1.65,
                      color: '#555',
                      margin: 0,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. BUILT ON TRUST (container 85d16c3: #F4F1E8)               */}
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
            {/* Left Column: Text & Checklist */}
            <div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.2,
                  color: '#1A1A1A',
                  margin: '0 0 20px 0',
                }}
              >
                Built on Trust. Sustained by Shared Accountability.
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: '#4a4a4a',
                  marginBottom: '32px',
                }}
              >
                Savvey Savers facilitates and administers savings circles but does not hold or manage member funds. We safeguard member contributions through structured governance, transparent processes, and secure data practices designed to protect the integrity of every savings circle.
              </p>

              {/* 6 Checklist Items */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
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
                    <CheckCircle2 size={20} style={{ color: '#0E4F45', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Image (community-scaled.webp) */}
            <div>
              <div
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                }}
              >
                <img
                  src="/images/community.webp"
                  alt="Built on Trust - Savvey Savers Community"
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
        {/* 5. WHY MEMBERS JOIN SAVVEY SAVERS (container e086504: sage)  */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: 'rgba(14, 79, 69, 0.08)', // exact soft green tint
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  color: '#1A1A1A',
                  margin: 0,
                }}
              >
                Why Members Join Savvey Savers Collective
              </h2>
            </div>

            {/* 5 Milestone Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                { title: 'Property Deposits', icon: HomeIcon },
                { title: 'Education Expenses', icon: GraduationCap },
                { title: 'Business Capital', icon: Briefcase },
                { title: 'Diaspora Wealth Planning', icon: Globe2 },
                { title: 'Family Financial Planning', icon: Users2 },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFDFA',
                    borderRadius: '16px',
                    padding: '36px 24px',
                    textAlign: 'center',
                    border: '1px solid rgba(14, 79, 69, 0.12)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '14px',
                      backgroundColor: '#0E4F45',
                      color: '#FFFDFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <card.icon size={28} />
                  </div>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-family-title)',
                      color: '#1A1A1A',
                      margin: 0,
                      lineHeight: 1.35,
                    }}
                  >
                    {card.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. WHY SAVVEY SAVERS COLLECTIVE (container a24f3c9: #F4F1E8) */}
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
            {/* Left: Text & Checkmarks */}
            <div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.2,
                  color: '#1A1A1A',
                  margin: '0 0 16px 0',
                }}
              >
                Why Savvey Savers Collective
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: '#4a4a4a',
                  marginBottom: '28px',
                }}
              >
                We offer a structured community-driven alternative to traditional borrowing, built on shared trust and collective responsibility.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {[
                  'Achieve property deposit goals faster',
                  'Receive pooled funds without borrowing',
                  'No interest. No hidden fees',
                  'Build lasting financial discipline through structured accountability',
                  'A structured alternative to traditional borrowing',
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={18} style={{ color: '#0E4F45', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setWaitlistModalOpen(true)}
                style={{
                  padding: '12px 28px',
                  borderRadius: '360px',
                  border: '2px solid #0E4F45',
                  backgroundColor: '#0E4F45',
                  color: '#FFFDFA',
                  fontFamily: 'var(--font-family-title)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Join a Savings Circle</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Right: Image (savings-scaled.webp) */}
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
                  alt="Why Savvey Savers Collective"
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
        {/* 7. MEMBER TESTIMONIALS (container 31731c1: #FFFDFA)          */}
        {/* ============================================================ */}
        <section
          style={{
            backgroundColor: '#FFFDFA',
            padding: '90px 80px',
          }}
          className="responsive-section-padding"
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
                Member Testimonials
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
                Real Impact, Real Communities
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#555',
                  margin: '0 auto 28px',
                }}
              >
                What our members say about saving with the collective.
              </p>

              {/* Google Reviews Badge Header */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: '#f7f5ec',
                  padding: '10px 24px',
                  borderRadius: '360px',
                  border: '1px solid rgba(14, 79, 69, 0.12)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Savvey Savers Network Limited</span>
                <div style={{ display: 'flex', gap: '3px', color: '#f59e0b' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" />
                  ))}
                </div>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>5.0 Rating on Google Reviews</span>
              </div>
            </div>

            {/* Testimonials Cards (exact soft cream background: #f7f5ec) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {[
                {
                  name: 'olowo busola',
                  time: '11 months ago',
                  quote: 'Well organised...I have no regrets joining this group',
                },
                {
                  name: 'Simisola Adingupu',
                  time: '1 year ago',
                  quote: 'Started using savvy savers this year, just received my first half payment. I totally recommend.',
                },
                {
                  name: 'Aganbi vera',
                  time: '2 years ago',
                  quote: 'It’s the best, very true and safe',
                },
                {
                  name: 'Davidson Sunday',
                  time: '2 years ago',
                  quote: 'It is so lovely and no stress, so Compliance',
                },
                {
                  name: 'oronsaye Daniel',
                  time: '2 years ago',
                  quote: 'A very trusted and reliable saving club, I couldn’t have achieved my saving goals if not for savvey savers . Many thanks to the dedicated minds behind this great platform.',
                },
                {
                  name: 'Judy Dominic',
                  time: '2 years ago',
                  quote: 'My 1 years collection has just been deposited in my account.. yay!. This approach encourages financial discipline and helps me achieve my financial objectives faster. Highly recommend.',
                },
                {
                  name: 'Yori Gbadamosi',
                  time: '3 years ago',
                  quote: 'Savvey Savers Network Limited offers a range of savings solutions with transparent terms. Their excellent customer service, user-friendly online platform, transparent fee structures, and commitment to security make them a reliable choice for individuals looking to grow their savings with confidence.',
                },
              ].map((rev, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#f7f5ec', // exact --rev-color from WordPress widget
                    borderRadius: '16px',
                    padding: '28px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.95rem',
                      lineHeight: 1.65,
                      color: '#1A1A1A',
                      margin: '0 0 20px 0',
                    }}
                  >
                    "{rev.quote}"
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                      paddingTop: '14px',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1A1A1A' }}>
                        {rev.name}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#777' }}>
                        {rev.time}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="#f59e0b" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. START YOUR JOURNEY CTA (container c1e859e: image + #0E4F45)*/}
        {/* ============================================================ */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            minHeight: '480px',
            backgroundColor: '#0E4F45',
          }}
        >
          {/* Left Image: holding hands */}
          <div
            style={{
              backgroundImage: 'url(/images/holding-hands.webp)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '360px',
            }}
          />

          {/* Right Solid Green CTA content */}
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
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
