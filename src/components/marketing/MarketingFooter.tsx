'use client';

import Link from 'next/link';

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
        backgroundColor: '#1A1A1A',
        color: '#FFFDFA',
        padding: '60px 80px 40px',
        fontFamily: 'var(--font-family-body)',
        borderTop: '1px solid rgba(0, 0, 0, 0.2)',
      }}
      className="footer-main-container"
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
        }}
      >
        {/* 3 Columns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '48px',
            justifyContent: 'space-between',
          }}
        >
          {/* Column 1: Brand */}
          <div>
            <h4
              style={{
                margin: '0 0 4px 0',
                fontSize: '1.25rem',
                fontWeight: 700,
                fontFamily: 'var(--font-family-title)',
                color: '#FFFDFA',
                letterSpacing: '0.02em',
              }}
            >
              Savvey Savers
            </h4>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: 'var(--font-family-title)',
                color: '#FFFDFA',
                lineHeight: 1.2,
              }}
            >
              Collective
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.95rem',
                lineHeight: 1.65,
                color: '#dcd7ca',
                maxWidth: '380px',
              }}
            >
              Trusted community saving. A structured savings collective helping members across the UK achieve meaningful financial goals together.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h5
              style={{
                margin: '0 0 20px 0',
                fontSize: '1.1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-family-title)',
                color: '#FFFDFA',
              }}
            >
              Quick Links
            </h5>
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
                    color: '#FFFDFA',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#A46A3F')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFDFA')}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  style={{
                    color: '#FFFDFA',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#A46A3F')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFDFA')}
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  style={{
                    color: '#FFFDFA',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#A46A3F')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFDFA')}
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  style={{
                    color: '#FFFDFA',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#A46A3F')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFDFA')}
                >
                  Terms and Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Access Pill Buttons */}
          <div>
            <h5
              style={{
                margin: '0 0 20px 0',
                fontSize: '1.1rem',
                fontWeight: 700,
                fontFamily: 'var(--font-family-title)',
                color: '#FFFDFA',
              }}
            >
              Access
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '240px' }}>
              {onOpenLogin ? (
                <button
                  onClick={onOpenLogin}
                  style={{
                    backgroundColor: '#F4F1E8',
                    color: '#0E4F45',
                    border: 'none',
                    padding: '11px 24px',
                    borderRadius: '360px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-title)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F4F1E8')}
                >
                  Login
                </button>
              ) : (
                <Link
                  href="/login"
                  style={{
                    backgroundColor: '#F4F1E8',
                    color: '#0E4F45',
                    border: 'none',
                    padding: '11px 24px',
                    borderRadius: '360px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-title)',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F4F1E8')}
                >
                  Login
                </Link>
              )}

              {onOpenWaitlist ? (
                <button
                  onClick={onOpenWaitlist}
                  style={{
                    backgroundColor: '#0E4F45',
                    color: '#FFFDFA',
                    border: '2px solid #0E4F45',
                    padding: '11px 24px',
                    borderRadius: '360px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-title)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
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
                  Request Access
                </button>
              ) : (
                <Link
                  href="/#waitlist"
                  style={{
                    backgroundColor: '#0E4F45',
                    color: '#FFFDFA',
                    border: '2px solid #0E4F45',
                    padding: '11px 24px',
                    borderRadius: '360px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-family-title)',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.2s',
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
                  Request Access
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Important Notice Callout Box inside the dark footer (as the user explicitly requested) */}
        <div
          style={{
            padding: '24px 28px',
            borderRadius: '12px',
            backgroundColor: '#111a14',
            border: '1px solid #1c2e24',
            fontSize: '0.875rem',
            lineHeight: 1.65,
            color: '#a3b8ad',
          }}
        >
          <strong style={{ color: '#e2ede5', display: 'block', marginBottom: '6px', fontSize: '0.925rem' }}>
            Important Notice:
          </strong>
          Savvey Savers Collective provides structured savings circles to help members achieve financial goals through pooled contributions. We do not provide loans, banking services, or regulated investment products. Participation involves shared responsibility and adherence to community guidelines.
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)', width: '100%' }} />

        {/* Bottom Bar: GDPR notice & copyright */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.85rem',
            color: '#a3b8ad',
          }}
        >
          <div>
            We protect your personal data in accordance with GDPR and applicable data protection laws.
          </div>
          <div>
            © {new Date().getFullYear()} Savvey Savers Collective. All rights reserved.
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .footer-main-container {
            padding: 40px 24px 30px !important;
          }
        }
      `}</style>
    </footer>
  );
}
