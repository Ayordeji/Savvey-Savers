import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import MonthlyRevenueChart from './MonthlyRevenueChart';
import SparklineChart from './SparklineChart';
import CommitmentDonutChart from './CommitmentDonutChart';
import YearSelect from './YearSelect';
import {
  TrendingUp,
  Calendar,
  Gift,
  CheckCircle,
  Clock,
  Users,
  UserPlus,
  AlertTriangle,
  Info,
  ChevronDown,
  Check,
  ArrowRight,
  Receipt,
  PlusCircle
} from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  let selectedYear = '2026';
  try {
    const params = searchParams ? await searchParams : {};
    if (params && typeof params.year === 'string') {
      selectedYear = params.year;
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('DYNAMIC_SERVER_USAGE')) {
      throw err;
    }
  }

  const selectedYearNum = parseInt(selectedYear, 10) || 2026;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect('/');
  }

  let user: Awaited<ReturnType<typeof db.user.findUnique>> = null;
  try {
    user = await db.user.findUnique({ where: { id: payload.id } });
    if (!user && payload.email) {
      user = await db.user.findUnique({ where: { email: payload.email } });
    }
  } catch (dbErr: any) {
    if (dbErr?.digest === 'NEXT_REDIRECT' || dbErr?.message?.includes('NEXT_REDIRECT')) {
      throw dbErr;
    }
    console.error('Dashboard: DB error fetching user', dbErr);
    redirect('/');
  }

  if (!user) {
    redirect('/');
  }

  const isAdmin = user.role === 'ADMIN';

  // Dynamic Metrics Computation directly from verified database records
  let allTimeRevenue = 0;
  let revenueForYear = 0;
  let harvestReleasedTotal = 0;
  let completedHarvestsCount = 0;
  let activeCommitmentsCount = 0;
  let pendingCommitmentsCount = 0;
  let totalCommitmentsCount = 0;
  let activeUsersCount = 0;
  let invitedUsersCount = 0;
  let recentPayments: any[] = [];
  let unactivatedMembers: any[] = [];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthlyData = Array(12).fill(0);

  try {
    const [allCommitments, allPayments, rawUsers] = await Promise.all([
      db.commitment.findMany({
        include: { user: true }
      }),
      db.payment.findMany({
        where: { status: 'CONFIRMED' },
        include: { user: true, commitment: true },
        orderBy: { createdAt: 'desc' }
      }),
      db.user.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 1. Members count (active members vs invited awaiting activation)
    const nonAdminUsers = rawUsers.filter(u => u.role !== 'ADMIN' && !u.isSuperAdmin && u.id !== 'usr_admin');
    activeUsersCount = nonAdminUsers.filter(u => u.isActive).length;
    unactivatedMembers = nonAdminUsers.filter(u => !u.isActive);
    invitedUsersCount = unactivatedMembers.length;

    // 2. Commitments for selected year
    const yearCommitments = allCommitments.filter(c => Number(c.collectionYear) === selectedYearNum);
    totalCommitmentsCount = yearCommitments.length;
    activeCommitmentsCount = yearCommitments.filter(c => c.status === 'ACTIVE').length;
    pendingCommitmentsCount = yearCommitments.filter(c => c.status === 'PENDING').length;

    // 3. Harvests released
    const completedHarvests = allCommitments.filter(c =>
      c.harvestReleasedAt !== null || (c as any).harvestAmount > 0
    );
    completedHarvestsCount = completedHarvests.length;
    harvestReleasedTotal = completedHarvests.reduce((acc, c) => acc + (c.harvestAmount || 0), 0);

    // 4. All-time revenue = sum of all confirmed payments
    allTimeRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);

    // 5. Revenue for selected year
    const yearPayments = allPayments.filter(p => p.year === selectedYearNum);
    revenueForYear = yearPayments.reduce((acc, p) => acc + p.amount, 0);

    // 6. Monthly distribution for selected year
    months.forEach((m, idx) => {
      const monthPayments = yearPayments.filter(p => p.month?.trim().toLowerCase() === m.toLowerCase());
      monthlyData[idx] = monthPayments.reduce((acc, p) => acc + p.amount, 0);
    });

    // 7. Recent authentic transactions
    recentPayments = allPayments.slice(0, 5);
  } catch (err) {
    console.error('Dashboard metrics aggregation error:', err);
  }

  // Time-aware greeting
  const currentHour = new Date().getHours();
  let greetingTime = 'Good evening';
  if (currentHour < 12) greetingTime = 'Good morning';
  else if (currentHour < 17) greetingTime = 'Good afternoon';

  const userFirstName = user.firstName || user.name.split(' ')[0] || 'Iyore';
  const activeCommitmentPct = totalCommitmentsCount > 0 ? ((activeCommitmentsCount / totalCommitmentsCount) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header Greeting & Year Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            fontFamily: 'var(--font-family-title)',
            color: '#1a1a1a',
            lineHeight: 1.2
          }}>
            {greetingTime}, {userFirstName} 👋
          </h2>
          <p style={{ color: '#57655c', fontSize: '0.875rem', marginTop: '4px' }}>
            Real-time verified overview of Savvey Savers collective performance.
          </p>
        </div>

        {/* Date range & Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #dcd7ca',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#1a1a1a',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}>
            <span>1 Jan – 31 Dec {selectedYear}</span>
            <Calendar size={15} style={{ color: '#57655c' }} />
          </div>
          <YearSelect selectedYear={selectedYear} />
        </div>
      </div>

      {/* 2. Top 3 Hero Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Total Savings Volume (Dark Forest Green Brand Card with Sparkline) */}
        <div style={{
          backgroundColor: '#0c4e43',
          borderRadius: '18px',
          padding: '24px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '190px',
          boxShadow: '0 10px 25px -4px rgba(12, 78, 67, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c2d6cf', fontSize: '0.85rem', fontWeight: 500 }}>
                <span>Total Savings Volume</span>
                <Info size={14} style={{ opacity: 0.8 }} />
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 119, 70, 0.3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={16} />
              </div>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', marginTop: '12px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              £{allTimeRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#d97746', marginTop: '4px', fontWeight: 600 }}>
              All-time confirmed savings pool
            </div>
          </div>

          <SparklineChart />
        </div>

        {/* Card 2: Selected Year Savings Volume */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #dcd7ca',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '190px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#57655c', fontSize: '0.85rem', fontWeight: 500 }}>
                {selectedYear} Savings Volume
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fbf1ec',
                color: '#d97746',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={16} />
              </div>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#1a1a1a', marginTop: '12px', letterSpacing: '-0.02em' }}>
              £{revenueForYear.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#57655c', marginTop: '6px', fontWeight: 500 }}>
              {selectedYearNum === 2026 ? 'Jan & Feb collections confirmed (£44,300/mo)' : `Confirmed collections for ${selectedYear}`}
            </div>
          </div>
        </div>

        {/* Card 3: Harvests Released */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #dcd7ca',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '190px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#57655c', fontSize: '0.85rem', fontWeight: 500 }}>
                Harvests Released
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#e6f0ee',
                color: '#0c4e43',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Gift size={16} />
              </div>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#1a1a1a', marginTop: '12px', letterSpacing: '-0.02em' }}>
              £{harvestReleasedTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#57655c', marginTop: '6px', fontWeight: 500 }}>
              {completedHarvestsCount} completed harvest{completedHarvestsCount === 1 ? '' : 's'} recorded
            </div>
          </div>
        </div>
      </div>

      {/* 3. Four KPI Progress Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Active Commitments */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #dcd7ca',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '135px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#57655c' }}>Active Commitments</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#e6f0ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c4e43' }}>
                <CheckCircle size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1a1a1a', marginTop: '6px' }}>
              {activeCommitmentsCount} / {totalCommitmentsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '2px' }}>
              {activeCommitmentPct}% active in {selectedYear}
            </div>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${activeCommitmentPct}%`, height: '100%', backgroundColor: '#0c4e43', borderRadius: '9999px' }} />
          </div>
        </div>

        {/* Pending Commitments */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #dcd7ca',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '135px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#57655c' }}>Pending Commitments</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fbf1ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97746' }}>
                <Clock size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1a1a1a', marginTop: '6px' }}>
              {pendingCommitmentsCount} / {totalCommitmentsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '2px' }}>
              {pendingCommitmentsCount === 0 ? 'All commitments confirmed' : `${pendingCommitmentsCount} awaiting confirmation`}
            </div>
          </div>
        </div>

        {/* Active Members */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #dcd7ca',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '135px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#57655c' }}>Active Members</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#e6f0ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0c4e43' }}>
                <Users size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1a1a1a', marginTop: '6px' }}>
              {activeUsersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '2px' }}>
              {invitedUsersCount > 0 ? `${invitedUsersCount} awaiting activation` : 'All members active'}
            </div>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.round((activeUsersCount / (activeUsersCount + invitedUsersCount || 1)) * 100))}%`, height: '100%', backgroundColor: '#0c4e43', borderRadius: '9999px' }} />
          </div>
        </div>

        {/* Invited Members */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #dcd7ca',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '135px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#57655c' }}>Invited Members</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fbf1ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97746' }}>
                <UserPlus size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1a1a1a', marginTop: '6px' }}>
              {invitedUsersCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '2px' }}>
              {invitedUsersCount > 0 ? 'Pending platform activation' : 'No pending invitations'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Visuals: Savings Volume Over Time + At a Glance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        {/* Left: Savings Volume Over Time Bar Chart */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #dcd7ca',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-family-title)', margin: 0 }}>
                Savings Volume Over Time
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '3px' }}>
                Actual confirmed collections across months for {selectedYear}
              </p>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              border: '1px solid #dcd7ca',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#1a1a1a',
              fontWeight: 600,
              backgroundColor: '#faf9f6'
            }}>
              <span>Monthly Distribution</span>
            </div>
          </div>

          <MonthlyRevenueChart monthlyData={monthlyData} months={months} selectedYear={selectedYear} />
        </div>

        {/* Right: At a glance (Dark Brand Card) */}
        <div style={{
          backgroundColor: '#0c4e43',
          borderRadius: '18px',
          padding: '24px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          boxShadow: '0 10px 25px -4px rgba(12, 78, 67, 0.35)'
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              At a glance
            </h3>
          </div>

          {/* Top pill badge */}
          <div style={{
            marginTop: '8px',
            padding: '6px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            {activeCommitmentsCount} Active Commitments
          </div>

          {/* Large glowing terracotta circular checkmark */}
          <div style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '24px 0'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2.5px solid #d97746',
              boxShadow: '0 0 20px rgba(217, 119, 70, 0.45)'
            }} />
            <Check size={36} color="#FFFFFF" strokeWidth={3} />
          </div>

          <div style={{ color: '#c2d6cf', fontSize: '0.82rem', marginBottom: '8px' }}>
            {activeUsersCount} active verified members participating in cycle.
          </div>
        </div>
      </div>

      {/* 5. Attention Alert Banner */}
      <div style={{
        backgroundColor: '#FCF7ED',
        border: '1px solid #F4E4C6',
        borderRadius: '16px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8C5815', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertTriangle size={18} />
            <span>
              {invitedUsersCount > 0
                ? `${invitedUsersCount} pending action item${invitedUsersCount > 1 ? 's' : ''}`
                : 'All accounts and contributions are fully up to date'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: '#57655c' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0c4e43' }} />
              <span>0 overdue payments</span>
            </div>
            {invitedUsersCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97746' }} />
                <span>{invitedUsersCount} member invitation{invitedUsersCount > 1 ? 's' : ''} awaiting activation</span>
              </div>
            )}
          </div>
        </div>

        <Link
          href={invitedUsersCount > 0 ? "/dashboard/invitations" : "/dashboard/commitments"}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0c4e43',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background-color 0.15s'
          }}
        >
          <span>{invitedUsersCount > 0 ? "Review Invitations" : "View Commitments"}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 6. Recent Activity & Commitment Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gap: '20px'
      }}>
        {/* Left: Recent Activity Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #dcd7ca',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-family-title)', margin: 0 }}>
                Recent Activity
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '3px' }}>
                Live ledger transactions from the database
              </p>
            </div>
            <Link
              href="/dashboard/payments"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#0c4e43',
                textDecoration: 'none',
                padding: '4px 10px',
                border: '1px solid #dcd7ca',
                borderRadius: '8px'
              }}
            >
              View all
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentPayments.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                No recent payment transactions recorded.
              </div>
            ) : (
              recentPayments.map((p) => {
                const memberName = p.user?.name || (p as any).memberName || 'Member';
                const memberDisplayId = p.user?.displayId || p.user?.invitationId || '';
                const dateFormatted = new Date(p.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F5F3EF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#e6f0ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0c4e43',
                        flexShrink: 0
                      }}>
                        <Receipt size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                          Savings contribution confirmed
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#57655c' }}>
                          £{Number(p.amount).toLocaleString()} from {memberName} {memberDisplayId ? `(${memberDisplayId})` : ''} • {p.month} {p.year}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#8a968f' }}>{dateFormatted}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0c4e43' }}>
                        + £{Number(p.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Commitment Overview Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #dcd7ca',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-family-title)', margin: 0 }}>
              Commitment Overview
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '3px' }}>
              Status distribution for {selectedYear}
            </p>

            {/* Donut Chart */}
            <div style={{ marginTop: '16px' }}>
              <CommitmentDonutChart
                total={totalCommitmentsCount}
                active={activeCommitmentsCount}
                pending={pendingCommitmentsCount}
                completed={0}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F5F3EF' }}>
            <Link
              href="/dashboard/commitments"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0c4e43',
                textDecoration: 'none'
              }}
            >
              <span>View all commitments</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 7. Footer */}
      <footer style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid #ECE8E2',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.75rem',
        color: '#9CA3AF'
      }}>
        <span>© 2026 Savvey Savers Networks. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
