'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';

export default function CookiePolicyPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F4F1E8',
        fontFamily: 'var(--font-family-body)',
        color: '#1A1A1A',
      }}
    >
      <MarketingHeader
        activePath="/cookie-policy"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1, padding: '60px 80px 80px' }} className="responsive-legal-padding">
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            backgroundColor: '#FFFDFA',
            borderRadius: '24px',
            padding: '56px 64px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
          className="responsive-legal-card"
        >
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.4rem)',
              fontWeight: 700,
              fontFamily: 'var(--font-family-title)',
              color: '#1A1A1A',
              margin: '0 0 14px 0',
              lineHeight: 1.15,
            }}
          >
            Cookie Policy
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: '#666',
              marginBottom: '36px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              paddingBottom: '20px',
            }}
          >
            Last updated: <strong>July 2026</strong> · Savvey Savers Collective
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
              lineHeight: 1.7,
              fontSize: '1rem',
              color: '#2a2a2a',
            }}
          >
            <p>
              This Cookie Policy explains how Savvey Savers Collective uses cookies and similar technologies to recognise you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control their use.
            </p>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                1. What Are Cookies?
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                Cookies are small text files stored on your device when you visit a website. They help the site function properly, enhance user experience, and provide information to site owners.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                2. How We Use Cookies
              </h3>
              <p style={{ margin: '0 0 10px 0', color: '#4a4a4a' }}>
                We use cookies to:
              </p>
              <ul style={{ paddingLeft: '24px', margin: 0, color: '#4a4a4a' }}>
                <li>Ensure the website functions correctly;</li>
                <li>Improve performance and user experience;</li>
                <li>Understand how visitors interact with our site;</li>
                <li>Maintain security and prevent fraud.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                3. Types of Cookies We Use
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div style={{ backgroundColor: '#F4F1E8', padding: '16px 20px', borderRadius: '12px' }}>
                  <strong style={{ color: '#0E4F45', display: 'block', marginBottom: '4px' }}>
                    Essential Cookies
                  </strong>
                  <span style={{ color: '#4a4a4a', fontSize: '0.95rem' }}>
                    Necessary for core website functionality, secure login, and navigation.
                  </span>
                </div>
                <div style={{ backgroundColor: '#F4F1E8', padding: '16px 20px', borderRadius: '12px' }}>
                  <strong style={{ color: '#0E4F45', display: 'block', marginBottom: '4px' }}>
                    Performance Cookies
                  </strong>
                  <span style={{ color: '#4a4a4a', fontSize: '0.95rem' }}>
                    Help us understand site usage and improve performance across pages.
                  </span>
                </div>
                <div style={{ backgroundColor: '#F4F1E8', padding: '16px 20px', borderRadius: '12px' }}>
                  <strong style={{ color: '#0E4F45', display: 'block', marginBottom: '4px' }}>
                    Security Cookies
                  </strong>
                  <span style={{ color: '#4a4a4a', fontSize: '0.95rem' }}>
                    Protect user data, authentications, and prevent unauthorized access.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                4. Managing Cookies
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                You can control or delete cookies through your browser settings. Disabling cookies may affect website functionality.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                5. Third-Party Cookies
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We may use trusted third-party services that place cookies to help us understand site usage and improve services. These providers comply with applicable data protection laws.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                6. Data Protection
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We process data collected through cookies in accordance with GDPR and applicable data protection regulations.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                7. Updates to This Policy
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We may update this Cookie Policy periodically. Changes will be posted on this page with an updated revision date.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                8. Contact Us
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                If you have questions about our Cookie Policy, please contact us at:{' '}
                <a href="mailto:info@savveysavers.com" style={{ color: '#0E4F45', fontWeight: 600 }}>
                  info@savveysavers.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CTA Banner matching WordPress site */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          minHeight: '440px',
          backgroundColor: '#0E4F45',
        }}
      >
        <div
          style={{
            backgroundImage: 'url(/images/holding-hands.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '340px',
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

      <MarketingFooter
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />

      <style jsx>{`
        @media (max-width: 900px) {
          .responsive-legal-padding {
            padding: 0 !important;
          }
          .responsive-legal-card {
            padding: 32px 18px !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
