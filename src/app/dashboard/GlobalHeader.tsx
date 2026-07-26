'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, X, User as UserIcon } from 'lucide-react';
import styles from './layout.module.css';

interface GlobalHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    membership?: string;
    displayId?: string;
  };
  unreadCount: number;
}

const DEFAULT_AGREEMENT = `Savvey Savers Network Limited Membership Agreement

By becoming a network member of Savvey Savers Network Limited, you agree to the terms stated in this membership agreement.

This Membership Agreement is entered into by and between Savvey Savers Network Limited, hereinafter referred to as the "Platform," any registered platform member that has paid a membership fee, hereinafter referred to as the "Member" or "Network Member."

Definition of terms

Platform – the Savvey Savers Network Limited website where network members can register for and access their accounts.

Cycle / Annual Membership Period – a 12 calendar month period during which network members are required to make monthly payments to the tune of their pre-agreed monthly savings commitment amount.

Member / Network Member– an individual who has successfully completed registration on the platform, finalized their monthly Savings Commitment(s), and made their annual membership payment.

Membership Fees– an annual fee of £35.99 payable by an individual that wishes to become a Member of the Savvey Savers Network. Please see our Fees page for more information.

Administration / Admin Fees– additional administration fees payable by members wishing to save more than the defined threshold covered by the annual membership fee. Please see our Fees page for more information.

Savings Harvest– the total amount of a Network Member’s monthly savings that is release to them at a pre-agreed time.

Savings Commitment– the monthly amount that a Network Member commits to save monthly for a minimum period of 12 calendar months.

Collection Month– the pre-agreed month that a Network Member’s savings harvest will be released to them.

Platform Administrator / Admin– employees of Savvey Savers Network Limited responsible for moderating and supervising platform activities

Relationship Manager– – a NetworkMember’s dedicated contact at Savvey Savers Network Limited.

1. MEMBERSHIP

1.1. Eligibility: You must be 18 years or older to become a Network Member of Savvey Savers Network Limited; and by signing this Agreement, the Member confirms that they meet the eligibility criteria for membership as specified by the Platform.

1.2. Term: This membership is effective as of the date of acceptance and payment of the annual membership fee; and shall continue for a minimum period of 12 calendar months unless terminated by either party in accordance with the terms herein.

2. PLATFORM SERVICES AND OBLIGATIONS

2.1. Peer-to-Peer Savings: The Platform is an “invite-only” platform that provides a peer-to-peer savings service that connects likeminded Members who wish to contribute a pre-agreed savings amount monthly; and disburse the total saved amount interest-free as a harvest to any Member(s) due a collection that month.

2.2. Access: Members will have access to the Platform's website or application and associated services during the term of their membership.

2.3. Platform Moderation: The Platform Admin will ensure that the services are always available to members and that any service outage is reported to members in a timely manner.

3. MEMBERSHIP FEES

3.1. Annual Membership Fee: The Member agrees to pay a membership fee as determined by the Platform. The membership fee is payable in advance and is non-refundable.

3.2. Payment Method: The Member agrees to pay the annual membership fee into the bank account details supplied to them by their Relationship Manager.

4. SAVINGS CONTRIBUTIONS

4.1. Payment Due Date: Monthly contribution payments are due on the 28th day of each calendar month.

4.2. Contribution Schedule: Members agree to contribute their pre-agreed Savings Commitment amount to the peer-to-peer savings pool on a monthly basis until the end of the Cycle, as determined by the Platform. Members agree to continue to make their monthly contributions even after harvesting their savings unless their Collection Month is December.

4.3. Withdrawal: Members may only withdraw their savings on their Collection Month and according to any other terms and conditions set by Savvey Savers Limited.

4.4. Savings Harvest Release: The Platform will ensure that Members’ harvest payments are released no later than the 2nd working day of the month preceding their collection month.

4.5. Withholding Savings Harvests: The Platform reserves the right to withhold or delay all or part of a Member’s harvest payment if it suspects that the Member has or may violate the terms of this agreement.

5. TERMINATION

5.1. Termination by Member: A Member may terminate their membership before 14 days before the commence of or at the end of their annual membership period by providing written notice to their Relationship Manager. Any membership fees already paid are non-refundable.

5.2. Termination by Platform: The Platform reserves the right to terminate a Member's membership for violation of these terms or any other reason deemed appropriate by the Platform.

6. PENALTIES

6.1. Late Monthly Contribution: The Platform reserves the right to charge a £50 flat late fee for any payments delayed beyond the 28th day of a calendar month.

6.2. Non-Payment of Monthly Contributions: The Platform reserves the right to terminate a defaulting Member’s membership. Where a membership termination is as a result of the Member defaulting on payments, any contributions already made by the member will be released to them by the end of the cycle, with 20% penalty charged on their total contribution if they haven’t already harvested their savings.

6.3. Legal Action: Where the Member defaults after harvesting their savings and before the end of their cycle, and their collection month is not December, the Platform reserves the right retrieve the monies owed by the Member, including to taking legal action against the Member where it deems appropriate; and the member will be liable to pay all legal expenses incurred by the Platform.

7. CONFIDENTIALITY

7.1. Member Information: The Platform agrees to keep Members’ information confidential and will not disclose it to third parties except as required by law.

8. GOVERNING LAW

8.1. Jurisdiction: This Agreement is governed by and construed in accordance with English laws. Any disputes arising under or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts in England.

9. MISCELLANEOUS

9.1. Amendments: The Platform reserves the right to amend these terms at any time. Members will be notified of any changes.

9.2. Entire Agreement: This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, whether written or oral.`;

const DEFAULT_FEE_SCHEDULE = `Network Membership and Administrative Fee Schedule

Membership Fees

To participate in our peer-to-peer savings platform, members are required to pay an annual membership fee of £35.99, as specified during the registration process. This fee contributes to the operational costs associated with maintaining the web platform and coordinating administrative tasks within and outside the platform. 

Members can currently save in increments of £250, and up to a maximum of £1,000 per slot for savings harvest and a maximum of £4,000 per year. The membership fee covers the maximum monthly contribution of £1,000 per slot, savings more than £1,000 per month will attract additional administrative fees as detailed in the next section.

Administrative Fees

In addition to the membership fee, there are various administrative fees associated with specific services or transactions. These fees cover the administrative overhead involved in processing and facilitating various activities within the platform.

One of such fees is an additional £10 payable for every extra £1 to £999 saved in addition to the first £1,000 covered by the £35.99 annual membership fee.

For example, if you are saving a total of £1,000 monthly, this will be covered by your flat rate annual membership fee of £35.99. However, if you decide to save an additional £200 to make your monthly savings £1,200, a one-off administrative fee of £10 is chargeable in addition to your annual membership fee, and if you decide to save £2500 monthly, then the fee is £20 plus your annual membership fee.

Late Fees

As a Platform, our aim is to support our members to achieve their financial goals quicker, and we do this by ensuring they can access their savings harvest on time. Monthly contribution payments are due on the 28th day of each month, and Members who pay their monthly contribution later than this date may incur an added £50 late fee charge.

Penalties

Savvey Savers Network Limited reserves the right to terminate a defaulting Member’s membership. Where a membership termination is due to the Member defaulting on payments, any contributions already made by the member will be released to them by the end of the cycle, with 20% penalty charged on their total contribution if they have not already harvested their savings.

Where the Member defaults after harvesting their savings and before the end of their cycle, and their collection month is not December, the Platform reserves the right retrieve the monies owed by the Member, including to taking legal action against the Member where it deems appropriate; and the member will be liable to pay all legal expenses incurred by Savvey Savers Limited.

Important Notice

It is essential for members to review this information regularly, as fees may be subject to change, and any updates will be communicated in advance. We are committed to maintaining transparency in our fee structure, and we encourage members to reach out to their Relationship Manager / Contact for any clarifications or further assistance about fees and charges.`;

export default function GlobalHeader({ user, unreadCount }: GlobalHeaderProps) {
  const [activeModal, setActiveModal] = useState<'NONE' | 'AGREEMENT' | 'FEE_SCHEDULE'>('NONE');
  const [agreementText, setAgreementText] = useState(DEFAULT_AGREEMENT);
  const [feeScheduleText, setFeeScheduleText] = useState(DEFAULT_FEE_SCHEDULE);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.membershipAgreement) setAgreementText(data.membershipAgreement);
        if (data.feeSchedule) setFeeScheduleText(data.feeSchedule);
      })
      .catch(() => {});
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setActiveModal('NONE');
    }
  };

  const REVIEWS_URL = "https://www.google.com/search?authuser=0&hl=en&sca_esv=90e47ce38a807d1a&cs=0&output=search&q=Savvey+Savers+Network+Limited&ludocid=1723843643196866088&lsig=AB86z5WYdK-LdT3ollfvufAR3Jnz&kgs=4f2c1844f9ffd9f9&shndl=-1&shem=lsp&source=sh/x/loc/hdr/m1/2#lrd=0x47d89d1601cae061:0x17ec52a901107e28,1,,,,";

  return (
    <>
      <header className={styles.headerBar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        {/* Left Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveModal('AGREEMENT')}
            style={{ backgroundColor: '#2e3a4e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Membership Agreement
          </button>
          <button
            onClick={() => setActiveModal('FEE_SCHEDULE')}
            style={{ backgroundColor: '#2e3a4e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Fee Schedule
          </button>
          <a
            href={REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#2e3a4e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
          >
            Reviews
          </a>
        </div>

        {/* Right User & Notification Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/dashboard/notifications" style={{ position: 'relative', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
              <UserIcon size={18} />
            </div>
            <span>
              {user.name} {user.displayId ? `(${user.displayId})` : user.id ? `(${user.id})` : ''}
            </span>
          </div>
        </div>
      </header>

      {/* --- MEMBERSHIP AGREEMENT MODAL --- */}
      {activeModal === 'AGREEMENT' && (
        <div className="modal-overlay" onClick={handleBackdropClick} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '750px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '16px', color: '#111827', fontFamily: 'var(--font-family-title)' }}>
              Savvey Savers Network Limited Membership Agreement
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              {agreementText}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEE SCHEDULE MODAL --- */}
      {activeModal === 'FEE_SCHEDULE' && (
        <div className="modal-overlay" onClick={handleBackdropClick} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '750px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '16px', color: '#111827', fontFamily: 'var(--font-family-title)' }}>
              Network Membership and Administrative Fee Schedule
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              {feeScheduleText}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
