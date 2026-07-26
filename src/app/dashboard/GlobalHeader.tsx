'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, X, User as UserIcon, LogOut, ChevronDown, Edit2, Save, Menu } from 'lucide-react';
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

const DEFAULT_AGREEMENT = `<h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: #1e293b;">
  Savvey Savers Network Limited Membership Agreement
</h4>
<p style="margin-bottom: 12px;">By becoming a network member of <strong>Savvey Savers Network Limited</strong>, you agree to the terms stated in this membership agreement.</p>
<p style="margin-bottom: 16px;">This Membership Agreement is entered into by and between <strong>Savvey Savers Network Limited</strong>, hereinafter referred to as the "Platform," any registered platform member that has paid a membership fee, hereinafter referred to as the "Member" or "Network Member."</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">Definition of Terms</h5>
<ul style="padding-left: 20px; line-height: 1.7; margin-bottom: 16px;">
  <li><strong>Platform</strong> – the Savvey Savers Network Limited website where network members can register for and access their accounts.</li>
  <li><strong>Cycle / Annual Membership Period</strong> – a <strong>12 calendar month period</strong> during which network members are required to make monthly payments to the tune of their pre-agreed monthly savings commitment amount.</li>
  <li><strong>Member / Network Member</strong> – an individual who has successfully completed registration on the platform, finalized their monthly Savings Commitment(s), and made their annual membership payment.</li>
  <li><strong>Membership Fees</strong> – an annual fee of <strong>£35.99</strong> payable by an individual that wishes to become a Member of the Savvey Savers Network. Please see our Fees page for more information.</li>
  <li><strong>Administration / Admin Fees</strong> – additional administration fees payable by members wishing to save more than the defined threshold covered by the annual membership fee. Please see our Fees page for more information.</li>
  <li><strong>Savings Harvest</strong> – the total amount of a Network Member’s monthly savings that is released to them at a pre-agreed time.</li>
  <li><strong>Savings Commitment</strong> – the monthly amount that a Network Member commits to save monthly for a minimum period of <strong>12 calendar months</strong>.</li>
  <li><strong>Collection Month</strong> – the pre-agreed month that a Network Member’s savings harvest will be released to them.</li>
  <li><strong>Platform Administrator / Admin</strong> – employees of Savvey Savers Network Limited responsible for moderating and supervising platform activities.</li>
  <li><strong>Relationship Manager</strong> – a Network Member’s dedicated contact at Savvey Savers Network Limited.</li>
</ul>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">1. MEMBERSHIP</h5>
<p style="margin-bottom: 8px;"><strong>1.1. Eligibility:</strong> You must be <strong>18 years or older</strong> to become a Network Member of Savvey Savers Network Limited; and by signing this Agreement, the Member confirms that they meet the eligibility criteria for membership as specified by the Platform.</p>
<p style="margin-bottom: 16px;"><strong>1.2. Term:</strong> This membership is effective as of the date of acceptance and payment of the annual membership fee; and shall continue for a minimum period of <strong>12 calendar months</strong> unless terminated by either party in accordance with the terms herein.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">2. PLATFORM SERVICES AND OBLIGATIONS</h5>
<p style="margin-bottom: 8px;"><strong>2.1. Peer-to-Peer Savings:</strong> The Platform is an <strong>“invite-only” platform</strong> that provides a peer-to-peer savings service that connects likeminded Members who wish to contribute a pre-agreed savings amount monthly; and disburse the total saved amount interest-free as a harvest to any Member(s) due a collection that month.</p>
<p style="margin-bottom: 8px;"><strong>2.2. Access:</strong> Members will have access to the Platform's website or application and associated services during the term of their membership.</p>
<p style="margin-bottom: 16px;"><strong>2.3. Platform Moderation:</strong> The Platform Admin will ensure that the services are always available to members and that any service outage is reported to members in a timely manner.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">3. MEMBERSHIP FEES</h5>
<p style="margin-bottom: 8px;"><strong>3.1. Annual Membership Fee:</strong> The Member agrees to pay a membership fee as determined by the Platform. The membership fee is payable in advance and is <strong>non-refundable</strong>.</p>
<p style="margin-bottom: 16px;"><strong>3.2. Payment Method:</strong> The Member agrees to pay the annual membership fee into the bank account details supplied to them by their Relationship Manager.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">4. SAVINGS CONTRIBUTIONS</h5>
<p style="margin-bottom: 8px;"><strong>4.1. Payment Due Date:</strong> Monthly contribution payments are due on the <strong>28th day</strong> of each calendar month.</p>
<p style="margin-bottom: 8px;"><strong>4.2. Contribution Schedule:</strong> Members agree to contribute their pre-agreed Savings Commitment amount to the peer-to-peer savings pool on a monthly basis until the end of the Cycle, as determined by the Platform. Members agree to continue to make their monthly contributions even after harvesting their savings unless their Collection Month is December.</p>
<p style="margin-bottom: 8px;"><strong>4.3. Withdrawal:</strong> Members may only withdraw their savings on their Collection Month and according to any other terms and conditions set by Savvey Savers Limited.</p>
<p style="margin-bottom: 8px;"><strong>4.4. Savings Harvest Release:</strong> The Platform will ensure that Members’ harvest payments are released no later than the <strong>2nd working day</strong> of the month preceding their collection month.</p>
<p style="margin-bottom: 16px;"><strong>4.5. Withholding Savings Harvests:</strong> The Platform reserves the right to withhold or delay all or part of a Member’s harvest payment if it suspects that the Member has or may violate the terms of this agreement.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">5. TERMINATION</h5>
<p style="margin-bottom: 8px;"><strong>5.1. Termination by Member:</strong> A Member may terminate their membership before <strong>14 days</strong> before the commencement of or at the end of their annual membership period by providing written notice to their Relationship Manager. Any membership fees already paid are <strong>non-refundable</strong>.</p>
<p style="margin-bottom: 16px;"><strong>5.2. Termination by Platform:</strong> The Platform reserves the right to terminate a Member's membership for violation of these terms or any other reason deemed appropriate by the Platform.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">6. PENALTIES</h5>
<p style="margin-bottom: 8px;"><strong>6.1. Late Monthly Contribution:</strong> The Platform reserves the right to charge a <strong>£50 flat late fee</strong> for any payments delayed beyond the <strong>28th day</strong> of a calendar month.</p>
<p style="margin-bottom: 8px;"><strong>6.2. Non-Payment of Monthly Contributions:</strong> The Platform reserves the right to terminate a defaulting Member’s membership. Where a membership termination is as a result of the Member defaulting on payments, any contributions already made by the member will be released to them by the end of the cycle, with a <strong>20% penalty</strong> charged on their total contribution if they haven’t already harvested their savings.</p>
<p style="margin-bottom: 16px;"><strong>6.3. Legal Action:</strong> Where the Member defaults after harvesting their savings and before the end of their cycle, and their collection month is not December, the Platform reserves the right to retrieve the monies owed by the Member, including taking legal action against the Member where it deems appropriate; and the member will be liable to pay all legal expenses incurred by the Platform.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">7. CONFIDENTIALITY</h5>
<p style="margin-bottom: 16px;"><strong>7.1. Member Information:</strong> The Platform agrees to keep Members’ information confidential and will not disclose it to third parties except as required by law.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">8. GOVERNING LAW</h5>
<p style="margin-bottom: 16px;"><strong>8.1. Jurisdiction:</strong> This Agreement is governed by and construed in accordance with <strong>English laws</strong>. Any disputes arising under or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts in England.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 16px; margin-bottom: 8px; color: #0f172a;">9. MISCELLANEOUS</h5>
<p style="margin-bottom: 8px;"><strong>9.1. Amendments:</strong> The Platform reserves the right to amend these terms at any time. Members will be notified of any changes.</p>
<p style="margin-bottom: 16px;"><strong>9.2. Entire Agreement:</strong> This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, whether written or oral.</p>`;

const DEFAULT_FEE_SCHEDULE = `<h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; color: #1e293b;">
  SAVVEY SAVERS COLLECTIVE
</h4>
<h5 style="font-size: 1rem; font-weight: 700; margin-bottom: 4px; color: #0f172a;">
  MEMBERSHIP &amp; FEE SCHEDULE
</h5>
<p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
  <strong>Version 2.0: Updated July 2026</strong>
</p>
<p style="margin-bottom: 16px;">
  This Membership &amp; Fee Schedule forms part of the Savvey Savers Collective Membership Agreement and should be read alongside it.
</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Annual Membership Fee
</h5>
<p style="margin-bottom: 8px;">To participate in the Savvey Savers Collective, Members are required to pay an Annual Membership Fee of <strong>£35.99</strong>.</p>
<p style="margin-bottom: 8px;">The Annual Membership Fee is payable before Membership becomes active and contributes towards the operational costs of administering the Collective, maintaining the Member Portal and supporting the day-to-day management of the savings programme.</p>
<p style="margin-bottom: 8px;">The Annual Membership Fee covers Monthly Savings Payments of up to <strong>£1,000</strong>.</p>
<p style="margin-bottom: 16px;">Unless otherwise required by law, the Annual Membership Fee is <strong>non-refundable</strong>.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Monthly Savings Payments
</h5>
<p style="margin-bottom: 8px;">Members may currently save between <strong>£250 and £4,000 per month</strong>, in increments of £250.</p>
<p style="margin-bottom: 8px;">Your selected Monthly Savings Payment remains payable throughout the Membership Year, which runs from <strong>1 January to 31 December</strong>.</p>
<p style="margin-bottom: 16px;">Receiving your Savings Harvest does not end your obligation to continue making your Monthly Savings Payments until the end of the Membership Year.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Additional Administration Fees
</h5>
<p style="margin-bottom: 8px;">Members saving more than £1,000 per month are required to pay an additional one-off Administration Fee.</p>
<p style="margin-bottom: 12px;">An additional Administration Fee of <strong>£10</strong> is payable for each additional band of up to £1,000 in Monthly Savings Payments above the first £1,000 covered by the Annual Membership Fee.</p>

<h5 style="font-weight: 700; font-size: 0.9rem; margin-top: 14px; margin-bottom: 8px; color: #0f172a;">
  Administration Fee Bands
</h5>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.875rem;">
  <thead>
    <tr style="background-color: #f1f5f9; text-align: left;">
      <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Total Monthly Savings Payments</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Additional Administration Fee</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Up to £1,000</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£0</td></tr>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£1,001 – £2,000</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£10</td></tr>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£2,001 – £3,000</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£20</td></tr>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£3,001 – £4,000</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£30</td></tr>
  </tbody>
</table>

<h5 style="font-weight: 700; font-size: 0.9rem; margin-top: 14px; margin-bottom: 8px; color: #0f172a;">
  Examples
</h5>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.875rem;">
  <thead>
    <tr style="background-color: #f1f5f9; text-align: left;">
      <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Monthly Savings Payment</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Annual Membership Fee</th>
      <th style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">Additional Administration Fee</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£1,000</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£35.99</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£0</td></tr>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£1,200</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£35.99</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£10</td></tr>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£2,500</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£35.99</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£20</td></tr>
    <tr><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£4,000</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£35.99</td><td style="padding: 8px 10px; border: 1px solid #cbd5e1;">£30</td></tr>
  </tbody>
</table>

<p style="margin-bottom: 16px;">The applicable Administration Fee is payable when joining the Collective or whenever a Member increases their Monthly Savings Payment into a higher fee band.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Payment Due Date
</h5>
<p style="margin-bottom: 8px;">Monthly Savings Payments are due on the <strong>last day of each calendar month</strong>.</p>
<p style="margin-bottom: 8px;">A grace period is provided until the end of the <strong>3rd day of the following month</strong> to allow for banking or payment processing delays.</p>
<p style="margin-bottom: 8px;">Payments not received by the end of the grace period will be treated as late and the applicable Late Payment Fee will apply.</p>
<p style="margin-bottom: 16px;">Members should always aim to make payment by the last day of the month, rather than relying on the grace period.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Late Payment Fee
</h5>
<p style="margin-bottom: 8px;">A Late Payment Fee of <strong>£50</strong> will apply where a Monthly Savings Payment has not been received by the end of the grace period.</p>
<p style="margin-bottom: 8px;">Members who anticipate difficulty making a payment should contact their Dedicated Relationship Manager before the payment becomes overdue.</p>
<p style="margin-bottom: 8px;">Repeated late payments may result in the Member’s Collection Month being moved to a later month, including December, in accordance with the Membership Agreement.</p>
<p style="margin-bottom: 16px;">Outstanding Late Payment Fees may also be deducted from a Member’s Savings Harvest where permitted under the Membership Agreement.</p>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Savings Harvest
</h5>
<p style="margin-bottom: 12px;">Your Savings Harvest will normally be released during your allocated Collection Month, provided you have complied with the Membership Agreement and all applicable fees and Monthly Savings Payments have been paid.</p>

<div style="background-color: #f8fafc; padding: 12px 16px; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 12px;">
  <strong style="display: block; margin-bottom: 4px; color: #1e293b;">Example 1</strong>
  <p style="margin: 0; font-size: 0.875rem;">You make a Monthly Savings Payment of £500. Your Collection Month is June. You receive your Savings Harvest in June and continue making your Monthly Savings Payments until 31 December.</p>
</div>

<div style="background-color: #f8fafc; padding: 12px 16px; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 16px;">
  <strong style="display: block; margin-bottom: 4px; color: #1e293b;">Example 2</strong>
  <p style="margin: 0; font-size: 0.875rem;">Your Collection Month is December. You make your Monthly Savings Payments throughout the Membership Year before receiving your Savings Harvest in December.</p>
</div>

<h5 style="font-weight: 700; font-size: 0.95rem; margin-top: 20px; margin-bottom: 8px; color: #0f172a;">
  Important Notes
</h5>
<ul style="padding-left: 20px; line-height: 1.7; margin-bottom: 16px; font-size: 0.875rem;">
  <li>The Membership Year runs from <strong>1 January to 31 December</strong>.</li>
  <li>Monthly Savings Payments are due on the <strong>last day of each month</strong>.</li>
  <li>The <strong>3rd day of the following month</strong> is a grace period, not the payment due date.</li>
  <li>Receiving your Savings Harvest does not end your Membership or your remaining Monthly Savings Payment obligations.</li>
  <li>This Membership &amp; Fee Schedule should be read together with the Membership Agreement, which contains the full terms and conditions governing your Membership.</li>
</ul>`;

export default function GlobalHeader({ user, unreadCount }: GlobalHeaderProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'NONE' | 'AGREEMENT' | 'FEE_SCHEDULE'>('NONE');
  const [agreementText, setAgreementText] = useState(DEFAULT_AGREEMENT);
  const [feeScheduleText, setFeeScheduleText] = useState(DEFAULT_FEE_SCHEDULE);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Admin inline editing state
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editHtml, setEditHtml] = useState('');
  const [savingContent, setSavingContent] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.membershipAgreement) setAgreementText(data.membershipAgreement);
        if (data.feeSchedule) setFeeScheduleText(data.feeSchedule);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate clean display ID
  const getCleanDisplayId = () => {
    if (user.displayId && user.displayId.startsWith('M-')) {
      return user.displayId;
    }
    if (user.id && (user.id.startsWith('usr_') || user.id.startsWith('M-'))) {
      return user.id;
    }
    return `M-000417`;
  };

  const cleanDisplayId = getCleanDisplayId();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
    router.refresh();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setActiveModal('NONE');
      setIsEditingContent(false);
    }
  };

  const handleStartEdit = () => {
    setEditHtml(activeModal === 'AGREEMENT' ? agreementText : feeScheduleText);
    setIsEditingContent(true);
  };

  const handleSaveContent = async () => {
    setSavingContent(true);
    try {
      const key = activeModal === 'AGREEMENT' ? 'membershipAgreement' : 'feeSchedule';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editHtml }),
      });

      if (res.ok) {
        if (activeModal === 'AGREEMENT') setAgreementText(editHtml);
        if (activeModal === 'FEE_SCHEDULE') setFeeScheduleText(editHtml);
        setIsEditingContent(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingContent(false);
    }
  };

  const REVIEWS_URL = "https://www.google.com/search?authuser=0&hl=en&sca_esv=90e47ce38a807d1a&cs=0&output=search&q=Savvey+Savers+Network+Limited&ludocid=1723843643196866088&lsig=AB86z5WYdK-LdT3ollfvufAR3Jnz&kgs=4f2c1844f9ffd9f9&shndl=-1&shem=lsp&source=sh/x/loc/hdr/m1/2#lrd=0x47d89d1601cae061:0x17ec52a901107e28,1,,,,";

  return (
    <>
      {/* DESKTOP HEADER BAR (Visible on screens >= 1024px) */}
      <header className={`desktop-global-header-bar ${styles.headerBar}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'relative', zIndex: 1000 }}>
        {/* Left Action Buttons */}
        <div className="global-header-left" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveModal('AGREEMENT'); setIsEditingContent(false); }}
            style={{ backgroundColor: '#2e3a4e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Membership Agreement
          </button>
          <button
            onClick={() => { setActiveModal('FEE_SCHEDULE'); setIsEditingContent(false); }}
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
        <div className="global-header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/dashboard/notifications" style={{ position: 'relative', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Dropdown Button */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                <UserIcon size={18} />
              </div>
              <span>
                {user.name} ({cleanDisplayId})
              </span>
              <ChevronDown size={16} style={{ color: '#64748b', transition: 'transform 0.2s', transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {showUserDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '42px', width: '220px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: '12px', zIndex: 10001 }}>
                <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{user.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>{cleanDisplayId} • {user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', color: '#ef4444', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* TABLET & MOBILE NAVIGATION CARD (Matching Screenshot, visible on screens < 1024px) */}
      <div className="mobile-header-navigation-card">
        {/* Row 1: Site Title, Notifications Bell + Profile Icon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '14px' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', fontFamily: 'var(--font-family-title)', letterSpacing: '-0.01em' }}>
            Savvey Savers Networks
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href="/dashboard/notifications" style={{ position: 'relative', color: '#1e293b', display: 'flex', alignItems: 'center' }}>
              <Bell size={22} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount}
                </span>
              )}
            </Link>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #1e293b', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', cursor: 'pointer', padding: 0 }}
              >
                <UserIcon size={20} />
              </button>

              {showUserDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '42px', width: '220px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: '12px', zIndex: 10001 }}>
                  <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>{cleanDisplayId} • {user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', color: '#ef4444', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Auxiliary Pill Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => { setActiveModal('AGREEMENT'); setIsEditingContent(false); }}
            style={{ backgroundColor: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Membership Agreement
          </button>
          <button
            onClick={() => { setActiveModal('FEE_SCHEDULE'); setIsEditingContent(false); }}
            style={{ backgroundColor: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Fee Schedule
          </button>
          <a
            href={REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
          >
            Reviews
          </a>
        </div>
      </div>

      {/* --- MEMBERSHIP AGREEMENT MODAL --- */}
      {activeModal === 'AGREEMENT' && (
        <div className="modal-overlay" onClick={handleBackdropClick} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '800px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => { setActiveModal('NONE'); setIsEditingContent(false); }} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingRight: '36px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-family-title)', margin: 0 }}>
                Savvey Savers Network Limited Membership Agreement
              </h3>
              {user.role === 'ADMIN' && !isEditingContent && (
                <button
                  onClick={handleStartEdit}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Edit2 size={14} />
                  <span>Edit Content</span>
                </button>
              )}
            </div>

            {isEditingContent ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                  Edit HTML content below (supports bold, lists, and headers):
                </p>
                <textarea
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                  style={{ width: '100%', minHeight: '350px', fontFamily: 'monospace', fontSize: '0.85rem', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', lineHeight: 1.5 }}
                />
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsEditingContent(false)} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '8px 18px', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveContent} disabled={savingContent} className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 22px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={14} />
                    <span>{savingContent ? 'Saving...' : 'Save Agreement'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: agreementText }}
                style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
            )}

            {!isEditingContent && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FEE SCHEDULE MODAL --- */}
      {activeModal === 'FEE_SCHEDULE' && (
        <div className="modal-overlay" onClick={handleBackdropClick} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '800px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => { setActiveModal('NONE'); setIsEditingContent(false); }} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingRight: '36px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-family-title)', margin: 0 }}>
                Network Membership and Administrative Fee Schedule
              </h3>
              {user.role === 'ADMIN' && !isEditingContent && (
                <button
                  onClick={handleStartEdit}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Edit2 size={14} />
                  <span>Edit Content</span>
                </button>
              )}
            </div>

            {isEditingContent ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                  Edit HTML content below (supports bold, lists, and headers):
                </p>
                <textarea
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                  style={{ width: '100%', minHeight: '350px', fontFamily: 'monospace', fontSize: '0.85rem', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', lineHeight: 1.5 }}
                />
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsEditingContent(false)} className="btn btn-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '8px 18px', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveContent} disabled={savingContent} className="btn btn-primary" style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '8px 22px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={14} />
                    <span>{savingContent ? 'Saving...' : 'Save Fee Schedule'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: feeScheduleText }}
                style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
            )}

            {!isEditingContent && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setActiveModal('NONE')} style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
