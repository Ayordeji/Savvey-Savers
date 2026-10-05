'use client';

import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

interface MarketingFooterProps {
  onOpenLogin?: () => void;
  onOpenWaitlist?: () => void;
}

export default function MarketingFooter({
  onOpenLogin,
  onOpenWaitlist,
}: MarketingFooterProps) {
  return (
    <footer
      style={{
        backgroundColor: '#090e0c', // deep forest black matching sidebar
        color: '#e2ede5',
        borderTop: '1px solid #14241d',
        fontFamily: 'var(--font-family-body)',
        padding: '64px 24px 36px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
        }}
      >
        {/* Top 3-Column Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
          }}
        >
          {/* Column 1: Brand & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Link href="/" style={{ display: 'inline-block' }}>
              <img
                src="/logo_new-removebg-preview.png"
                alt="Savvey Savers Collective"
                style={{
                  height: '48px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'brightness(1.1)',
                }}
              />
            </Link>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.65,
                color: '#a3b8ad',
                margin: 0,
                maxWidth: '360px',
              }}
            >
              Trusted community saving. A structured savings collective helping members across the UK achieve meaningful financial goals together through disciplined pooled contributions.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(21, 128, 61, 0.15)',
                border: '1px solid rgba(21, 128, 61, 0.3)',
                color: '#86efac',
                fontSize: '0.8125rem',
                fontWeight: 600,
                width: 'fit-content',
              }}
            >
              <ShieldCheck size={16} />
              <span>UK Residents · Referral & Vetted Only</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-family-title)',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '18px',
                letterSpacing: '0.02em',
              }}
            >
              Quick Links
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <li>
                <Link
                  href="/about-us"
                  style={{
                    color: '#c5d6cc',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#c5d6cc')}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  style={{
                    color: '#c5d6cc',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#c5d6cc')}
                >
                  Frequently Asked Questions (FAQs)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  style={{
                    color: '#c5d6cc',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#c5d6cc')}
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  style={{
                    color: '#c5d6cc',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#c5d6cc')}
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Access & Member Portal */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-family-title)',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '18px',
                letterSpacing: '0.02em',
              }}
            >
              Member Access
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {onOpenLogin ? (
                <button
                  onClick={onOpenLogin}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-title)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'var(--secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  <span>Member Portal Login</span>
                  <ArrowUpRight size={16} />
                </button>
              ) : (
                <Link
                  href="/login"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-title)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'var(--secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  <span>Member Portal Login</span>
                  <ArrowUpRight size={16} />
                </Link>
              )}

              {onOpenWaitlist ? (
                <button
                  onClick={onOpenWaitlist}
                  style={{
                    backgroundColor: 'var(--secondary)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-title)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px var(--secondary-glow)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--secondary-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--secondary)')}
                >
                  <span>Request Circle Access</span>
                  <ArrowUpRight size={16} />
                </button>
              ) : (
                <Link
                  href="/#waitlist"
                  style={{
                    backgroundColor: 'var(--secondary)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-family-title)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px var(--secondary-glow)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--secondary-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--secondary)')}
                >
                  <span>Request Circle Access</span>
                  <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Important Notice Callout */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: '10px',
            backgroundColor: '#111a14',
            border: '1px solid #1c2e24',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#94a79c',
          }}
        >
          <strong style={{ color: '#e2ede5', display: 'block', marginBottom: '4px' }}>
            Important Notice:
          </strong>
          Savvey Savers Collective provides structured savings circles to help members achieve financial goals through pooled contributions. We do not provide loans, banking services, or regulated investment products. Participation involves shared responsibility and adherence to community guidelines.
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingTop: '24px',
            borderTop: '1px solid #14241d',
            fontSize: '0.8125rem',
            color: '#718378',
          }}
        >
          <div>
            © {new Date().getFullYear()} Savvey Savers Collective. All rights reserved.
          </div>
          <div>
            We protect your personal data in accordance with GDPR and applicable UK data protection laws.
          </div>
        </div>
      </div>
    </footer>
  );
}
