import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import MonthlyRevenueChart from './MonthlyRevenueChart';
import YearSelect from './YearSelect';
import {
  TrendingUp,
  Clock,
  Gift,
  Users,
  Briefcase,
  PiggyBank,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedYear = typeof params.year === 'string' ? params.year : '2026';
  const selectedYearNum = parseInt(selectedYear, 10);

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect('/');
  }

  const user = await db.users.findUnique({ where: { id: payload.id } });
  if (!user) {
    redirect('/');
  }

  const isAdmin = user.role === 'ADMIN';

  // --- QUERY & METRICS COMPUTATION ---
  let pendingPaymentsAmount = 0;
  let totalPaymentsCount = 0;
  let confirmedPaymentsCount = 0;
  let totalCommitmentsCount = 0;
  let completedCommitmentsCount = 0;
  let activeUsersCount = 0;
  let invitedUsersCount = 0;
  let totalRevenue = 0;

  // Monthly values for chart (Jan - Dec)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthlyData = Array(12).fill(0);

  if (isAdmin) {
    // Admin: Aggregated data for all members
    const allPayments = await db.payments.findMany();
    const allCommitments = await db.commitments.findMany();
    const activeCommitmentIds = allCommitments.map((c) => c.id);

    const confirmedPaymentsAll = allPayments.filter(
      (p) => p.status === 'CONFIRMED' && activeCommitmentIds.includes(p.commitmentId)
    );
    totalRevenue = confirmedPaymentsAll.reduce((acc, p) => acc + p.amount, 0);

    const paymentsYearly = allPayments.filter(
      (p) => String(p.year) === String(selectedYear) && activeCommitmentIds.includes(p.commitmentId)
    );
    const confirmedPaymentsYearly = paymentsYearly.filter((p) => p.status === 'CONFIRMED');
    const pendingPaymentsYearly = paymentsYearly.filter((p) => p.status === 'PENDING');
    
    pendingPaymentsAmount = pendingPaymentsYearly.reduce((acc, p) => acc + p.amount, 0);
    totalPaymentsCount = paymentsYearly.length;
    confirmedPaymentsCount = confirmedPaymentsYearly.length;

    const commitmentsYearly = allCommitments.filter((c) => String(c.collectionYear) === String(selectedYear));
    totalCommitmentsCount = commitmentsYearly.length;
    completedCommitmentsCount = commitmentsYearly.filter((c) => c.status === 'COMPLETED').length;

    const allUsers = await db.users.findMany((u) => u.role === 'MEMBER');
    activeUsersCount = allUsers.filter((u) => u.isActive).length;
    invitedUsersCount = allUsers.length;

    // Populate monthly data (filtered by year, past & current month only)
    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    confirmedPaymentsYearly.forEach((p) => {
      const monthIdx = months.indexOf(p.month);
      const pYear = Number(selectedYear);
      const isFuture = pYear > currentYearNum || (pYear === currentYearNum && monthIdx > currentMonthIdx);
      if (monthIdx !== -1 && !isFuture) {
        monthlyData[monthIdx] += p.amount;
      }
    });
  } else {
    // Member: Personal data only
    const myCommitments = await db.commitments.findMany((c) => c.memberId === user.id);
    const myCommitmentsYearly = myCommitments.filter((c) => String(c.collectionYear) === String(selectedYear));
    totalCommitmentsCount = myCommitmentsYearly.length;
    completedCommitmentsCount = myCommitmentsYearly.filter((c) => c.status === 'COMPLETED').length;

    const myCommitmentIds = myCommitments.map((c) => c.id);
    const myPaymentsAll = await db.payments.findMany((p) => myCommitmentIds.includes(p.commitmentId));
    const myConfirmedPaymentsAll = myPaymentsAll.filter((p) => p.status === 'CONFIRMED');
    totalRevenue = myConfirmedPaymentsAll.reduce((acc, p) => acc + p.amount, 0);

    const myPaymentsYearly = myPaymentsAll.filter((p) => String(p.year) === String(selectedYear));
    const myConfirmedPaymentsYearly = myPaymentsYearly.filter((p) => p.status === 'CONFIRMED');
    const myPendingPaymentsYearly = myPaymentsYearly.filter((p) => p.status === 'PENDING');

    pendingPaymentsAmount = myPendingPaymentsYearly.reduce((acc, p) => acc + p.amount, 0);
    totalPaymentsCount = myPaymentsYearly.length;
    confirmedPaymentsCount = myConfirmedPaymentsYearly.length;

    // Populate monthly data (filtered by year, past & current month only)
    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    myConfirmedPaymentsYearly.forEach((p) => {
      const monthIdx = months.indexOf(p.month);
      const pYear = Number(selectedYear);
      const isFuture = pYear > currentYearNum || (pYear === currentYearNum && monthIdx > currentMonthIdx);
      if (monthIdx !== -1 && !isFuture) {
        monthlyData[monthIdx] += p.amount;
      }
    });
  }

  // --- SVG CHART PARAMETERS ---
  const chartHeight = 180;
  const chartWidth = 700;
  const maxVal = Math.max(...monthlyData, 1000); // minimum scale limit
  const barWidth = 36;
  const gap = 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Summary Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        width: '100%'
      }} className="dashboard-cards-grid">
        {/* Card: Revenue to date / Total Revenue */}
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          minHeight: '130px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <TrendingUp size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
              Revenue to date
            </span>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
              £{totalRevenue.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Card: Unconfirmed Payments / Payments not yet Confirmed */}
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          minHeight: '130px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Users size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
              Payments not yet Confirmed
            </span>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
              {totalPaymentsCount - confirmedPaymentsCount} / {totalPaymentsCount}
            </h3>
          </div>
        </div>

        {/* Card: Pending Payments */}
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          minHeight: '130px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Clock size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
              Pending Payments
            </span>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
              £{pendingPaymentsAmount.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Card: Payments Confirmed */}
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          minHeight: '130px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <CheckCircle size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
              Payments Confirmed
            </span>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
              {confirmedPaymentsCount} / {totalPaymentsCount}
            </h3>
          </div>
        </div>

        {/* Card: Harvests Released */}
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          minHeight: '130px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Gift size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
              Harvests Released
            </span>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
              {completedCommitmentsCount} of {totalCommitmentsCount}
            </h3>
          </div>
        </div>

        {/* Card: Active vs Invited */}
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          minHeight: '130px',
          color: '#ffffff'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Users size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
              Active vs Invited
            </span>
            <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
              {isAdmin ? `${activeUsersCount} / ${invitedUsersCount}` : '2 / 2'}
            </h3>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart Panel */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Revenue by month
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Confirmed payments in the selected year
            </p>
          </div>
          <YearSelect selectedYear={selectedYear} />
        </div>

        {/* Responsive SVG Chart */}
        <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
          <MonthlyRevenueChart monthlyData={monthlyData} months={months} selectedYear={selectedYear} />
        </div>
      </div>
    </div>
  );
}
