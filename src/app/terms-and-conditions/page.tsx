'use client';

import { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import AuthModal from '@/components/marketing/AuthModal';
import WaitlistModal from '@/components/marketing/WaitlistModal';
import { FileText, ShieldAlert } from 'lucide-react';

export default function TermsAndConditionsPage() {
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
        activePath="/terms-and-conditions"
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
            <FileText size={16} />
            <span>Legal Documentation</span>
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
            Terms and Conditions
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
            Effective Date: <strong>1st of July 2026</strong> · Savvey Savers Collective
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
              Welcome to the Savvey Savers Collective website (“Website”). These Terms and Conditions govern your use of our Website. By accessing or using this Website, you agree to be bound by these Terms. If you do not agree, please do not use this Website.
            </p>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                1. About Us
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                This Website is operated by Savvey Savers Collective (“SSC”, “we”, “our” or “us”). Our Website provides information about our community savings model and allows prospective members to join our waiting list or contact us. Use of this Website does not in itself create membership of Savvey Savers Collective.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                2. Eligibility
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                You must be at least 18 years old and a resident of the United Kingdom to use this Website or join our waiting list. By using this Website, you confirm that you meet these criteria.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                3. Waiting List
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Joining our waiting list does not guarantee membership. Applications are reviewed based on circle availability, referral validation, and our membership criteria. We reserve the right to accept or decline any application at our discretion. Being invited to join a savings circle remains subject to full onboarding checks and verification.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                4. Website Use
              </h3>
              <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)' }}>
                You agree to use this Website only for lawful purposes. You must not:
              </p>
              <ul style={{ paddingLeft: '24px', margin: 0, color: 'var(--text-muted)' }}>
                <li>Misuse or attempt to interfere with the proper working of the Website;</li>
                <li>Introduce malicious software, viruses, or harmful code;</li>
                <li>Attempt to gain unauthorised access to our systems, servers, or databases;</li>
                <li>Use the Website in any manner that disrupts or impairs other users;</li>
                <li>Copy, scrape, reproduce, or repurpose Website content without prior written permission.</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                5. Information You Provide
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                If you submit information through our Website (such as waiting list applications or contact enquiries), you warrant that all information provided is accurate, complete, and current. You are responsible for informing us if your contact details change.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                6. Intellectual Property
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Unless otherwise stated, all content on this Website—including text, graphics, logos, branding, images, documents, software, and design—is owned by Savvey Savers Collective or used under licence. You may view and download material for your own personal, non-commercial use. You may not reproduce, distribute, or commercially exploit any content without our prior written consent.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                7. Privacy
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Our collection and use of personal information is governed by our Privacy Policy and UK GDPR regulations. By using this Website, you acknowledge that you have read and understood our data protection practices.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                8. Cookies
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                This Website uses cookies to improve your browsing experience and understand how visitors interact with our platform. You can manage your cookie preferences through your browser settings. Further information can be found in our Cookie Policy.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                9. Website Availability
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                We aim to keep our Website operational and accessible at all times. However, we do not guarantee uninterrupted access and reserve the right to suspend, withdraw, or modify any part of the Website without prior notice.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                10. Accuracy of Information
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                We make reasonable efforts to ensure the information published on this Website is accurate. However, information is provided for general guidance only and may change without notice. Nothing on this Website constitutes financial, legal, investment, or professional advice.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                11. Limitation of Liability
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                To the fullest extent permitted by law, Savvey Savers Collective shall not be liable for any direct, indirect, incidental, consequential, or special loss or damage arising from your use of, or inability to use, this Website. Nothing in these Terms excludes liability that cannot legally be excluded under applicable law.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                12. Links to Other Websites
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Our Website may contain links to third-party websites for your convenience. We do not control or endorse those websites and are not responsible for their content, security, or privacy practices.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                13. Changes to These Terms
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                We may update these Terms from time to time. Any changes will take effect once published on this Website. Your continued use of the Website constitutes acceptance of the revised Terms.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                14. Governing Law
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                These Terms are governed by and construed in accordance with the laws of England and Wales. Any dispute arising from these Terms or your use of this Website shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--primary)', marginBottom: '8px' }}>
                15. Contact Us
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                If you have questions regarding these Terms and Conditions, please contact us at:{' '}
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
