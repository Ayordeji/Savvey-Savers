'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Clock,
  Award,
  ArrowRight,
  FileCheck,
  Scale,
  Lock,
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
        backgroundColor: 'var(--bg-main)',
        fontFamily: 'var(--font-family-body)',
        color: 'var(--text-main)',
      }}
    >
      <MarketingHeader
        activePath="/about-us"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section
          style={{
            padding: '70px 24px 60px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 2,
            }}
          >
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
                marginBottom: '20px',
              }}
            >
              <ShieldCheck size={16} />
              <span>Our Story & Mission</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                lineHeight: 1.15,
                margin: '0 0 20px 0',
                maxWidth: '850px',
                letterSpacing: '-0.02em',
              }}
            >
              Built On Trust. Sustained By Shared Accountability.
            </h1>

            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
                lineHeight: 1.65,
                color: '#c5d6cc',
                maxWidth: '780px',
                margin: '0 0 40px 0',
              }}
            >
              What began as small, member-led savings circles has grown into a well-established network where individuals come together to support one another through disciplined saving, strict governance, and community empowerment.
            </p>

            {/* 4 Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginTop: '30px',
              }}
            >
              {[
                { number: '12+', label: 'Years of community savings cycles', icon: Clock },
                { number: '£2M+', label: 'In member savings allocations completed', icon: TrendingUp },
                { number: '100+', label: 'Successful savings circles completed', icon: Award },
                { number: '40+', label: 'Active vetted members across the UK', icon: Users },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '24px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <stat.icon size={24} style={{ color: 'var(--secondary)', marginBottom: '12px' }} />
                  <div
                    style={{
                      fontSize: '2.4rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-family-title)',
                      color: '#ffffff',
                      lineHeight: 1.1,
                      marginBottom: '6px',
                    }}
                  >
                    {stat.number}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#a3b8ad',
                      lineHeight: 1.4,
                      fontWeight: 500,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Our Purpose */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--secondary)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                Our Purpose
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  lineHeight: 1.2,
                  color: 'var(--text-main)',
                  margin: '0 0 20px 0',
                }}
              >
                A Community Savings Model That Actually Works
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: 'var(--text-muted)',
                  marginBottom: '24px',
                }}
              >
                We exist to provide a trusted, community-driven approach to achieving financial goals. By bringing members together in structured savings circles, Savvey helps individuals plan towards meaningful milestones without the burden of commercial debt or interest.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '28px',
                }}
              >
                {[
                  'Property deposits and home ownership foundations.',
                  'Higher education, university fees, and professional qualifications.',
                  'Starting or expanding self-funded business ventures.',
                  'Diaspora asset investments and family financial planning.',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CheckCircle2
                      size={20}
                      style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}
                    />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <p
                style={{
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  borderLeft: '3px solid var(--secondary)',
                  paddingLeft: '16px',
                  margin: 0,
                }}
              >
                Through collective discipline and shared accountability, members support each other in reaching milestones that might otherwise feel out of reach.
              </p>
            </div>

            {/* Purpose Image Showcase */}
            <div style={{ position: 'relative' }}>
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
                  alt="Savvey Savers Community"
                  style={{
                    width: '100%',
                    height: '420px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Clarity & Transparency (What We Do vs What We Do Not Do) */}
        <section
          style={{
            padding: '80px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
                Clarity & Transparency
              </span>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-family-title)',
                  color: 'var(--text-main)',
                  margin: '0 0 12px 0',
                }}
              >
                What Savvey Savers Does and Does Not Do
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                  maxWidth: '650px',
                  margin: '0 auto',
                }}
              >
                We believe total transparency is the cornerstone of community trust. Here is a clear breakdown of our operating mandate:
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '28px',
              }}
            >
              {/* Card 1: What We Do */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '36px',
                  border: '1.5px solid rgba(12, 78, 67, 0.2)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--status-active-bg)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    marginBottom: '16px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Our Role as Facilitators</span>
                </div>

                <h3
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-family-title)',
                    color: 'var(--primary)',
                    margin: '0 0 16px 0',
                  }}
                >
                  What We Do
                </h3>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 24px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {[
                    { title: 'Administrative Coordination', desc: 'Organizing verified members into matched circles.' },
                    { title: 'Governance Structures', desc: 'Enforcing agreed guidelines and vetting protocols.' },
                    { title: 'Transparent Contribution Tracking', desc: 'Real-time ledger updates on member portals.' },
                    { title: 'Clear Savings Schedules', desc: 'Predictable, pre-agreed monthly distribution dates.' },
                  ].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {item.title}
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {item.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px',
                    margin: 0,
                  }}
                >
                  These frameworks help ensure clarity, accountability, and consistency within each savings circle.
                </p>
              </div>

              {/* Card 2: What We Do Not Do */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '36px',
                  border: '1.5px solid rgba(217, 119, 70, 0.2)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--secondary-light)',
                    color: 'var(--secondary)',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    marginBottom: '16px',
                  }}
                >
                  <XCircle size={16} />
                  <span>We are Not a Bank or Lender</span>
                </div>

                <h3
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-family-title)',
                    color: 'var(--secondary)',
                    margin: '0 0 16px 0',
                  }}
                >
                  What We Do Not Do
                </h3>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 24px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {[
                    { title: 'No Commercial Loans', desc: 'We do not lend capital, charge interest, or offer credit products.' },
                    { title: 'No Banking Services', desc: 'We do not operate deposit accounts or hold custodian funds.' },
                    { title: 'No Investment Products', desc: 'Circles are interest-free savings arrangements, not speculative yields.' },
                    { title: 'No Financial Advice', desc: 'We coordinate collective schedules but do not provide financial advisory.' },
                  ].map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <XCircle size={18} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {item.title}
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {item.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px',
                    margin: 0,
                  }}
                >
                  Savvey serves solely as the administrative and governance facilitator for member-driven savings circles. Participation is based on shared responsibility among members.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Built on Safeguards */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
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
              Governance & Safety
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                color: 'var(--text-main)',
                margin: '0 0 12px 0',
              }}
            >
              Built on Safeguards That Protect Every Member
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--text-muted)',
                maxWidth: '650px',
                margin: '0 auto',
              }}
            >
              These strict governance measures maintain trust, accountability, and transparent continuity across all circles:
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}
          >
            {[
              {
                icon: ShieldCheck,
                title: 'Member Verification',
                desc: 'All prospective members undergo identity, contact, and eligibility checks before placement in any circle.',
              },
              {
                icon: FileCheck,
                title: 'Transparent Tracking',
                desc: 'Every member receives access to the circle ledger to track contributions and scheduled disbursements in real-time.',
              },
              {
                icon: Clock,
                title: 'Defined Cycles',
                desc: 'Fixed timelines, preset contribution amounts, and verified payout calendars established before circle launch.',
              },
              {
                icon: Scale,
                title: 'Dispute Resolution',
                desc: 'Structured governance protocols and administrative mediation ensure fair and prompt resolution of any circle issues.',
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '28px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    marginBottom: '18px',
                  }}
                >
                  <card.icon size={24} />
                </div>
                <h4
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-title)',
                    color: 'var(--text-main)',
                    margin: '0 0 10px 0',
                  }}
                >
                  {card.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section
          style={{
            padding: '70px 24px',
            backgroundColor: 'var(--primary-dark)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                marginBottom: '16px',
              }}
            >
              Start Your Journey with Savvey Savers
            </h2>
            <p
              style={{
                fontSize: '1.05rem',
                color: '#c5d6cc',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              Apply to join a vetted circle today and experience the power of structured, disciplined community saving.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setWaitlistModalOpen(true)}
                style={{
                  padding: '14px 28px',
                  borderRadius: '8px',
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
                  boxShadow: '0 4px 16px var(--secondary-glow)',
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

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />
    </div>
  );
}
