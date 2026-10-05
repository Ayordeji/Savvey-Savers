'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';

export default function TermsAndConditionsPage() {
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
        activePath="/terms-and-conditions"
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
            Terms and Conditions
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

      {/* Main Content (Unboxed, natural page flow) */}
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
              Welcome to the Savvey Savers Collective website (“Website”). These Terms and Conditions govern your use of our Website. By accessing or using this Website, you agree to be bound by these Terms. If you do not agree, please do not use this Website.
            </p>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                1. About Us
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                This Website is operated by Savvey Savers Collective (“SSC”, “we”, “our” or “us”). Our Website provides information about our community savings model and allows prospective members to join our waiting list or contact us. Use of this Website does not create membership of Savvey Savers Collective.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                2. Eligibility
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                You must be at least 18 years old and a resident of the United Kingdom to use this Website or join our waiting list. By using this Website, you confirm that you meet this requirement.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                3. Waiting List
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                Joining our waiting list does not guarantee membership. Applications may be reviewed based on our membership criteria and available places. We reserve the right to accept or decline any application at our discretion. Being invited to join the Collective remains subject to our onboarding and verification processes.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                4. Website Use
              </h3>
              <p style={{ margin: '0 0 10px 0', color: '#4a4a4a' }}>
                You agree to use this Website only for lawful purposes. You must not:
              </p>
              <ul style={{ paddingLeft: '24px', margin: 0, color: '#4a4a4a' }}>
                <li>Misuse or attempt to interfere with the Website;</li>
                <li>Introduce malicious software or harmful code;</li>
                <li>Attempt to gain unauthorised access to our systems;</li>
                <li>Use the Website in a way that disrupts other users;</li>
                <li>Copy, scrape or reproduce Website content without permission.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                5. Information You Provide
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                If you submit information through our Website, you agree that it is accurate, complete and up to date. You are responsible for informing us if your contact details change.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                6. Intellectual Property
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                Unless otherwise stated, all content on this Website including text, graphics, logos, branding, images, documents and design is owned by Savvey Savers Collective or used under licence. You may view and download material for your own personal, non-commercial use. You may not reproduce, distribute, modify, publish or commercially exploit any Website content without our prior written permission.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                7. Privacy
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                Our collection and use of personal information is governed by our Privacy Policy. By using this Website, you acknowledge that you have read our Privacy Policy.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                8. Cookies
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                This Website uses cookies to improve your browsing experience and understand how visitors use our Website. You can manage your cookie preferences through your browser settings. Further information can be found in our Cookie Policy.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                9. Website Availability
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We aim to keep our Website available at all times. However, we do not guarantee uninterrupted access and may suspend, withdraw or change any part of the Website without notice.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                10. Accuracy of Information
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We make reasonable efforts to ensure the information published on this Website is accurate. However, information is provided for general guidance only and may change without notice. Nothing on this Website constitutes financial, legal or professional advice.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                11. Limitation of Liability
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                To the fullest extent permitted by law, Savvey Savers Collective shall not be liable for any direct, indirect, incidental, consequential or special loss or damage arising from your use of, or inability to use, this Website. Nothing in these Terms excludes liability that cannot legally be excluded under applicable law.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                12. Links to Other Websites
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                Our Website may contain links to third-party websites for your convenience. We do not control or endorse those websites and are not responsible for their content, security or privacy practices.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                13. Changes to These Terms
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                We may update these Terms from time to time. Any changes will take effect once published on this Website. Your continued use of the Website constitutes acceptance of the revised Terms.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                14. Governing Law
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                These Terms are governed by the laws of England and Wales. Any dispute arising from these Terms or your use of this Website shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'var(--font-family-title)', color: '#0E4F45', marginBottom: '8px' }}>
                15. Contact Us
              </h3>
              <p style={{ margin: 0, color: '#4a4a4a' }}>
                If you have any questions about these Terms, please contact us. Email:{' '}
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
              fontSize: 'clamp(1.35rem, 1.8vw, 1.75rem)',
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
        .responsive-legal-banner {
          padding: 56px 32px 50px;
        }
        .responsive-legal-main {
          padding: 56px 32px 80px;
        }
        @media (max-width: 900px) {
          .responsive-legal-banner {
            padding: 36px 16px 28px !important;
          }
          .responsive-legal-main {
            padding: 32px 16px 60px !important;
          }
        }
      `}</style>
    </div>
  );
}
