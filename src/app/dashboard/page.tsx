import Link from 'next/link';
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
  let totalRevenue = 0;
  let activeCommitmentsCount = 0;
  let pendingCommitmentsCount = 0;
  let notStartedCommitmentsCount = 0;
  let completedCommitmentsCount = 0;
  let totalCommitmentsCount = 0;
  let activeUsersCount = 0;
  let invitedUsersCount = 0;

  // Monthly values for chart (Jan - Dec)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthlyData = Array(12).fill(0);

  if (isAdmin) {
    // Admin: Dynamic aggregation from live imported database records
    const allCommitments = await db.commitments.findMany();
    const rawUsers = await db.users.findMany();

    // 1. Deduplicate members for user counts
    const uniqueMap = new Map<string, any>();
    rawUsers.forEach((u) => {
      if (!u) return;
      const k = u.email ? u.email.toLowerCase().trim() : (u.invitationId?.trim() || u.id);
      if (!uniqueMap.has(k) || u.role === 'ADMIN') uniqueMap.set(k, u);
    });
    const memberUsers = Array.from(uniqueMap.values()).filter((u) => u.role === 'MEMBER' || !u.isSuperAdmin);

    activeUsersCount = memberUsers.filter((u) => u.isActive).length;
    invitedUsersCount = memberUsers.filter((u) => !u.isActive).length;

    // 2. Filter commitments by selected collection year
    const selectedYearInt = parseInt(selectedYear, 10) || 2026;
    const yearCommitments = allCommitments.filter((c) => Number(c.collectionYear) === selectedYearInt);
    totalCommitmentsCount = yearCommitments.length;

    // 3. Status counts
    activeCommitmentsCount = yearCommitments.filter((c) => c.status === 'ACTIVE').length;
    pendingCommitmentsCount = yearCommitments.filter((c) => c.status === 'PENDING').length;
    completedCommitmentsCount = yearCommitments.filter((c) => c.status === 'COMPLETED').length;

    // 4. Expected Revenue: sum of all active and completed commitments in the year
    const revenueCommitments = yearCommitments.filter((c) => c.status === 'ACTIVE' || c.status === 'COMPLETED');
    totalRevenue = revenueCommitments.reduce((acc, c) => acc + c.amount, 0);

    // 5. Monthly Distribution (Expected revenue distributed by collection month)
    months.forEach((m, idx) => {
      const monthCmts = revenueCommitments.filter((c) => c.collectionMonth === m);
      monthlyData[idx] = monthCmts.reduce((acc, c) => acc + c.amount, 0);
    });
  } else {
    // Member: Personal data only
    const myCommitments = await db.commitments.findMany((c) => c.memberId === user.id);
    const myCommitmentsYearly = myCommitments.filter((c) => String(c.collectionYear) === String(selectedYear));
    totalCommitmentsCount = myCommitmentsYearly.length;
    
    activeCommitmentsCount = myCommitmentsYearly.filter((c) => c.status === 'ACTIVE').length;
    pendingCommitmentsCount = myCommitmentsYearly.filter((c) => c.status === 'PENDING').length;
    completedCommitmentsCount = myCommitmentsYearly.filter((c) => c.status === 'COMPLETED').length;

    const revenueCommitments = myCommitmentsYearly.filter((c) => c.status === 'ACTIVE' || c.status === 'COMPLETED');
    totalRevenue = revenueCommitments.reduce((acc, c) => acc + c.amount, 0);

    months.forEach((m, idx) => {
      const monthCmts = revenueCommitments.filter((c) => c.collectionMonth === m);
      monthlyData[idx] = monthCmts.reduce((acc, c) => acc + c.amount, 0);
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
      {/* Summary Cards Grid (All 6 Cards Restored & Interactive) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        width: '100%'
      }} className="dashboard-cards-grid">
        {/* Card 1: Revenue to date -> Links to Savings Commitments */}
        <Link href="/dashboard/commitments" style={{ textDecoration: 'none', display: 'block' }}>
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
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }} className="dashboard-interactive-card">
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
        </Link>

        {/* Card 2: Pending Commitments -> Links to PENDING Commitments */}
        <Link href="/dashboard/commitments?status=PENDING" style={{ textDecoration: 'none', display: 'block' }}>
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
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }} className="dashboard-interactive-card">
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Clock size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
                Pending Commitments
              </span>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
                {`${pendingCommitmentsCount} / ${totalCommitmentsCount}`}
              </h3>
            </div>
          </div>
        </Link>

        {/* Card 4: Active Commitments -> Links to ACTIVE Commitments */}
        <Link href="/dashboard/commitments?status=ACTIVE" style={{ textDecoration: 'none', display: 'block' }}>
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
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }} className="dashboard-interactive-card">
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <CheckCircle size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
                Active Commitments
              </span>
              <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
                {`${activeCommitmentsCount} / ${totalCommitmentsCount}`}
              </h3>
            </div>
          </div>
        </Link>

        {/* Card 4: Harvests Released -> Links to COMPLETED Commitments */}
        <Link href="/dashboard/commitments?status=COMPLETED" style={{ textDecoration: 'none', display: 'block' }}>
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
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }} className="dashboard-interactive-card">
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
                {`${completedCommitmentsCount} / ${totalCommitmentsCount}`}
              </h3>
            </div>
          </div>
        </Link>

        {/* Card 5: Active vs Invited -> Links to Manage Users */}
        <Link href="/dashboard/users" style={{ textDecoration: 'none', display: 'block' }}>
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
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }} className="dashboard-interactive-card">
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
                {`${activeUsersCount} / ${invitedUsersCount}`}
              </h3>
            </div>
          </div>
        </Link>
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
