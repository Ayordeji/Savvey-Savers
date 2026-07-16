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
  CheckCircle
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

    // Populate monthly data (filtered by year)
    confirmedPaymentsYearly.forEach((p) => {
      const monthIdx = months.indexOf(p.month);
      if (monthIdx !== -1) {
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

    // Populate monthly data (filtered by year)
    myConfirmedPaymentsYearly.forEach((p) => {
      const monthIdx = months.indexOf(p.month);
      if (monthIdx !== -1) {
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        width: '100%'
      }}>
        {/* Card 1: Pending Payments */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #f3f4f6',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              PENDING PAYMENTS
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#111827', margin: 0 }}>
              £{pendingPaymentsAmount.toFixed(2)}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, display: 'block', marginTop: '4px' }}>
              Awaiting Confirmation ({selectedYear})
            </span>
          </div>
        </div>

        {/* Card 2: Payments Confirmed */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #f3f4f6',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              PAYMENTS CONFIRMED
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(221, 107, 32, 0.08)', color: '#c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#111827', margin: 0 }}>
              {confirmedPaymentsCount} / {totalPaymentsCount}
            </h3>
          </div>
        </div>

        {/* Card 3: Harvests Released */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #f3f4f6',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              HARVESTS RELEASED
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(221, 107, 32, 0.08)', color: '#c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Gift size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#111827', margin: 0 }}>
              {completedCommitmentsCount} of {totalCommitmentsCount}
            </h3>
          </div>
        </div>

        {/* Card 4: Active vs Invited */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #f3f4f6',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ACTIVE VS INVITED
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(221, 107, 32, 0.08)', color: '#c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#111827', margin: 0 }}>
              {isAdmin ? `${activeUsersCount} / ${invitedUsersCount}` : '2 / 2'}
            </h3>
          </div>
        </div>

        {/* Card 5: Total Revenue */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #f3f4f6',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '140px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              TOTAL REVENUE
            </span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(221, 107, 32, 0.08)', color: '#c2410c',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#111827', margin: 0 }}>
              £{totalRevenue.toFixed(2)}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, display: 'block', marginTop: '4px' }}>
              All time
            </span>
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
          <MonthlyRevenueChart monthlyData={monthlyData} months={months} />
        </div>
      </div>
    </div>
  );
}
