'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import { ShieldCheck, Cookie } from 'lucide-react';

export default function CookiePolicyPage() {
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
        activePath="/cookie-policy"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      <main style={{ flex: 1, padding: '60px 24px 80px' }}>
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            <Cookie size={16} />
            <span>Privacy & Compliance</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-family-title)',
              color: 'var(--text-main)',
              margin: '0 0 12px 0',
            }}
          >
            Cookie Policy
          </h1>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              marginBottom: '32px',
              borderBottom: '1px solid var(--border-color)',
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
              fontSize: '0.95rem',
              color: 'var(--text-main)',
            }}
          >
            <p>
              This Cookie Policy explains how Savvey Savers Collective uses cookies and similar technologies to recognise you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control their use.
            </p>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                1. What Are Cookies?
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Cookies are small text files stored on your device when you visit a website. They help the site function properly, enhance user experience, remember session state, and provide analytical information to site administrators.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                2. How We Use Cookies
              </h3>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)' }}>
                We use cookies to:
              </p>
              <ul style={{ paddingLeft: '24px', margin: 0, color: 'var(--text-muted)' }}>
                <li>Ensure the platform and login verification functions correctly;</li>
                <li>Improve performance, page loading speeds, and overall user experience;</li>
                <li>Understand how visitors interact with our site and navigate between pages;</li>
                <li>Maintain session security, protect user accounts, and prevent fraud.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                3. Types of Cookies We Use
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                    Essential Cookies
                  </strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Necessary for core website functionality, user authentication, and secure access to the member dashboard.
                  </span>
                </div>
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                    Performance Cookies
                  </strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Help us understand site usage patterns, diagnose errors, and continuously improve site responsiveness.
                  </span>
                </div>
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                    Security Cookies
                  </strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Protect user data, validate HTTP session tokens, and prevent CSRF and unauthorised portal access.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                4. Managing Cookies
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                You can control or delete cookies through your browser settings. However, disabling essential cookies may impact your ability to log in to the Savvey Savers portal or navigate member pages.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                5. Third-Party Cookies
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                We may use trusted third-party analytics and infrastructure providers to understand aggregate site performance. These providers comply with UK GDPR and international data privacy frameworks.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                6. Data Protection
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                We process any personal data collected via cookies strictly in accordance with GDPR and applicable UK data protection regulations.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                7. Updates to This Policy
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                We may update this Cookie Policy periodically to reflect technological changes or regulatory updates. Changes will be posted on this page with an updated revision date.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                8. Contact Us
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                If you have questions regarding this Cookie Policy or your privacy preferences, please reach out to us at:{' '}
                <a href="mailto:info@savveysavers.com" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  info@savveysavers.com
                </a>
              </p>
            </div>
          </div>
        </div>
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
