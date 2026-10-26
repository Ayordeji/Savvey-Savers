'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';

export default function PrivacyPolicyPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  return (
    <div
      className="marketing-page-wrapper"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F4F1E8',
        fontFamily: 'var(--font-family-body)',
        color: '#1A1A1A',
        width: '100%',
        margin: 0,
        padding: 0,
      }}
    >
      <MarketingHeader
        activePath="/privacy-policy"
        onOpenLogin={() => setAuthModalOpen(true)}
        onOpenWaitlist={() => setWaitlistModalOpen(true)}
      />

      {/* Top Hero Banner */}
      <section
        style={{
          backgroundColor: '#F4F1E8',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
        className="responsive-legal-banner"
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 'clamp(2.35rem, 3.5vw, 3.2rem)',
              fontWeight: 700,
              fontFamily: 'var(--font-family-title)',
              color: '#1A1A1A',
              margin: '0 0 14px 0',
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: '#666',
              margin: 0,
            }}
          >
            Effective Date: <strong>1st of July 2026</strong> · Savvey Savers Collective
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          backgroundColor: '#FFFDFA',
        }}
        className="responsive-legal-main"
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
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
              At Savvey Savers Collective (&ldquo;SSC&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), protecting your personal information is important to us. This Privacy Policy explains what information we collect, why we collect it, how we use it, and the choices you have regarding your personal data.
            </p>

            <p style={{ marginTop: '-12px' }}>
              By using our website, you agree to the practices described in this Privacy Policy.
            </p>

            {/* Section 1 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                1. Who We Are
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                Savvey Savers Collective is a private community that brings members together through structured savings circles.
              </p>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We are committed to handling your personal information responsibly, securely and transparently.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                2. Information We Collect
              </h3>
              <p style={{ margin: '0 0 12px 0', color: '#4a4a4a' }}>
                Depending on how you interact with our website, we may collect:
              </p>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1A1A1A', margin: '14px 0 6px 0' }}>
                Information you provide
              </h4>
              <ul style={{ margin: 0, paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Name</li>
                <li>Email address</li>
                <li>Home Address</li>
                <li>Telephone number</li>
                <li>Any information you include when contacting us</li>
                <li>Waiting list registration details</li>
              </ul>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1A1A1A', margin: '18px 0 6px 0' }}>
                Information collected automatically
              </h4>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                When you visit our website, we may automatically collect:
              </p>
              <ul style={{ margin: 0, paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Pages visited</li>
                <li>Time spent on our website</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                3. How We Use Your Information
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                We only use your information where we have a lawful reason to do so. This includes:
              </p>
              <ul style={{ margin: '0 0 14px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Managing our waiting list</li>
                <li>Responding to enquiries</li>
                <li>Providing updates about Savvey Savers Collective</li>
                <li>Improving our website</li>
                <li>Preventing fraud and protecting our community</li>
                <li>Meeting our legal obligations</li>
              </ul>
              <p style={{ margin: 0, fontWeight: 600, color: '#1A1A1A' }}>
                We do not sell your personal information.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                4. Marketing Communications
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                If you choose to join our mailing list or waiting list, we may send you updates about:
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Membership opportunities</li>
                <li>New savings circles</li>
                <li>Community announcements</li>
                <li>Important service updates</li>
              </ul>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                You can unsubscribe at any time using the link in our emails.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                5. Cookies
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                Our website uses cookies to improve your browsing experience. Cookies help us:
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Remember your preferences</li>
                <li>Understand how visitors use our website</li>
                <li>Improve website performance</li>
                <li>Measure website traffic</li>
              </ul>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                You can control or disable cookies through your browser settings. For full details, please see our{' '}
                <Link href="/cookie-policy" style={{ color: '#0E4F45', fontWeight: 600, textDecoration: 'underline' }}>
                  Cookie Policy
                </Link>.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                6. Sharing Your Information
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                We only share personal information where necessary. This may include trusted service providers who help us operate our website, such as:
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Website hosting providers</li>
                <li>Email service providers</li>
                <li>Analytics providers</li>
                <li>Technology partners</li>
              </ul>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                These providers are only permitted to use your information to provide services on our behalf.
              </p>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We may also share information where required by law.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                7. Keeping Your Information Safe
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                We use appropriate technical and organisational measures to protect your information against:
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Unauthorised access</li>
                <li>Loss</li>
                <li>Misuse</li>
                <li>Alteration</li>
                <li>Disclosure</li>
              </ul>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                While no online system is completely secure, we continually work to protect your information.
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                8. How Long We Keep Your Information
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                We only keep personal information for as long as necessary to:
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Provide our services</li>
                <li>Manage our waiting list</li>
                <li>Meet legal and regulatory requirements</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                When information is no longer needed, it is securely deleted or anonymised.
              </p>
            </div>

            {/* Section 9 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                9. Your Rights
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                Under UK data protection law, you have the right to:
              </p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '24px', color: '#4a4a4a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Restrict how we use your information</li>
                <li>Object to certain types of processing</li>
                <li>Withdraw consent where consent has been given</li>
                <li>Request a copy of your information in a portable format</li>
              </ul>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We will respond to requests in accordance with applicable law.
              </p>
            </div>

            {/* Section 10 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                10. Third-Party Websites
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                Our website may contain links to other websites. We are not responsible for the privacy practices or content of external websites.
              </p>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We encourage you to read their privacy policies before providing personal information.
              </p>
            </div>

            {/* Section 11 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                11. Children&apos;s Privacy
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                Our services are intended for adults. We do not knowingly collect personal information from anyone under the age of 18.
              </p>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                If we become aware that we have collected information from a child, we will delete it promptly.
              </p>
            </div>

            {/* Section 12 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                12. Changes to This Policy
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                We may update this Privacy Policy from time to time.
              </p>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                The latest version will always be published on this page together with the effective date.
              </p>
            </div>

            {/* Section 13 */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                13. Contact Us
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#4a4a4a' }}>
                If you have any questions about this Privacy Policy or how we handle your personal information, please contact us.
              </p>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                Email:{' '}
                <a
                  href="mailto:info@savveysavers.com"
                  style={{
                    color: '#0E4F45',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenWaitlist={() => {
          setAuthModalOpen(false);
          setWaitlistModalOpen(true);
        }}
      />

      <WaitlistModal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        onOpenLogin={() => {
          setWaitlistModalOpen(false);
          setAuthModalOpen(true);
        }}
      />
    </div>
  );
}
