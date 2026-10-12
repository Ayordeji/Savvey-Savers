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
  PlusCircle,
  PiggyBank,
  Coins,
  Layers,
  CreditCard,
  CalendarRange,
  ArrowUpRight,
  Sparkles
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
  let yearCommitments: any[] = [];
  let relevantCommitments: any[] = [];
  let relevantPayments: any[] = [];

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

    const userKeys = Array.from(new Set([
      user.id,
      user.displayId,
      (user as any).invitationId,
      user.email
    ].filter((k): k is string => typeof k === 'string' && k.trim().length > 0)));

    // Scope data if user is not admin
    relevantCommitments = isAdmin
      ? allCommitments
      : allCommitments.filter(c => 
          userKeys.includes(c.memberId) || 
          (c.user?.email && userKeys.includes(c.user.email)) ||
          (user.name && c.memberName?.toLowerCase() === user.name.toLowerCase())
        );

    const relevantCommitmentIds = new Set(relevantCommitments.map(c => c.id));

    relevantPayments = isAdmin
      ? allPayments
      : allPayments.filter(p => 
          userKeys.includes(p.userId) || 
          relevantCommitmentIds.has(p.commitmentId)
        );

    // 1. Members count (active members vs invited awaiting activation)
    const nonAdminUsers = rawUsers.filter(u => u.role !== 'ADMIN' && !u.isSuperAdmin && u.id !== 'usr_admin');
    activeUsersCount = nonAdminUsers.filter(u => u.isActive).length;
    unactivatedMembers = nonAdminUsers.filter(u => !u.isActive);
    invitedUsersCount = unactivatedMembers.length;

    // 2. Commitments for selected year
    yearCommitments = relevantCommitments.filter(c => Number(c.collectionYear) === selectedYearNum);
    totalCommitmentsCount = yearCommitments.length;
    activeCommitmentsCount = yearCommitments.filter(c => c.status === 'ACTIVE').length;
    pendingCommitmentsCount = yearCommitments.filter(c => c.status === 'PENDING' || c.status === 'NOT_YET_STARTED').length;

    // 3. Harvests released / target
    const completedHarvests = relevantCommitments.filter(c =>
      Number(c.collectionYear) === selectedYearNum && (c.harvestReleasedAt !== null || (c as any).harvestAmount > 0)
    );
    completedHarvestsCount = completedHarvests.length;
    harvestReleasedTotal = isAdmin
      ? completedHarvests.reduce((acc, c) => acc + (c.harvestAmount || 0), 0)
      : yearCommitments.reduce((acc, c) => acc + (Number(c.amount) * 12), 0);

    // 4. All-time revenue = sum of all confirmed payments
    allTimeRevenue = relevantPayments.reduce((acc, p) => acc + p.amount, 0);

    // 5. Revenue for selected year
    const yearPayments = relevantPayments.filter(p => p.year === selectedYearNum);
    revenueForYear = yearPayments.reduce((acc, p) => acc + p.amount, 0);

    // 6. Monthly distribution for selected year
    months.forEach((m, idx) => {
      const monthPayments = yearPayments.filter(p => p.month?.trim().toLowerCase() === m.toLowerCase());
      monthlyData[idx] = monthPayments.reduce((acc, p) => acc + p.amount, 0);
    });

    // 7. Recent authentic transactions
    recentPayments = relevantPayments.slice(0, 5);
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
            {isAdmin
              ? 'Real-time verified overview of Savvey Savers collective performance.'
              : 'Track your personal savings progress, contributions, and upcoming harvest payouts.'}
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Selected Year Savings Volume (Dark Forest Green Brand Card with Sparkline) */}
        <Link
          href={`/dashboard/commitments?year=${selectedYear}`}
          className="dashboard-clickable-card-dark"
          title={`View ${selectedYear} savings volume`}
          style={{
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
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c2d6cf', fontSize: '0.85rem', fontWeight: 500 }}>
                <span>{isAdmin ? `${selectedYear} Savings Volume` : `My ${selectedYear} Total Saved`}</span>
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
              £{revenueForYear.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#d97746', marginTop: '4px', fontWeight: 600 }}>
              {isAdmin
                ? `Confirmed collections for ${selectedYear} →`
                : `Confirmed contributions in ${selectedYear} →`}
            </div>
          </div>

          <SparklineChart />
        </Link>

        {/* Card 2: Total Lifetime Savings */}
        <Link
          href="/dashboard/commitments"
          className="dashboard-clickable-card"
          title="View all confirmed lifetime savings"
          style={{
            background: 'linear-gradient(145deg, #FFFFFF 0%, #FFFDF9 50%, #FEF9F2 100%)',
            borderRadius: '18px',
            padding: '24px',
            border: '1.5px solid #F5DEB3',
            boxShadow: '0 4px 18px -2px rgba(217, 119, 70, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '190px'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#854D0E', fontSize: '0.85rem', fontWeight: 600 }}>
                {isAdmin ? 'Total Lifetime Savings' : 'My Lifetime Savings'}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #EA580C 0%, #D97746 50%, #C2410C 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)'
              }}>
                <PiggyBank size={18} />
              </div>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#1C1917', marginTop: '12px', letterSpacing: '-0.02em' }}>
              £{allTimeRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#C2410C', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{isAdmin ? 'All-time confirmed collections' : 'All-time confirmed savings pool'}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>

        {/* Card 3: 2026 Harvest Payout (Fixed Payout, Not Target) */}
        <Link
          href={isAdmin ? "/dashboard/reports/commitments" : "/dashboard/commitments"}
          className="dashboard-clickable-card"
          title={isAdmin ? "View harvest reports" : "View my savings commitments"}
          style={{
            background: 'linear-gradient(145deg, #F0FDF4 0%, #ECFDF5 50%, #D1FAE5 100%)',
            borderRadius: '18px',
            padding: '24px',
            border: '1.5px solid #6EE7B7',
            boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '190px'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#065F46', fontSize: '0.85rem', fontWeight: 700 }}>
                  {isAdmin ? 'Total Harvests Released' : `${selectedYear} Harvest Payout`}
                </span>
                <span style={{
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: '#A7F3D0',
                  color: '#064E3B'
                }}>
                  {isAdmin ? 'Released' : 'Fixed Payout'}
                </span>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
              }}>
                <Coins size={18} />
              </div>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#064E3B', marginTop: '12px', letterSpacing: '-0.02em' }}>
              £{harvestReleasedTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>
                {isAdmin
                  ? `${completedHarvestsCount} completed harvest${completedHarvestsCount === 1 ? '' : 's'} recorded`
                  : `Scheduled payout for ${selectedYear}`}
              </span>
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Four KPI Progress Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '16px'
      }}>
        {isAdmin ? (
          <>
            {/* Active Commitments */}
            <Link
              href={`/dashboard/commitments?status=ACTIVE&year=${selectedYear}`}
              className="dashboard-clickable-card"
              title={`View active commitments for ${selectedYear}`}
              style={{
                background: 'linear-gradient(145deg, #F0F9FF 0%, #E0F2FE 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #BAE6FD',
                boxShadow: '0 4px 14px -2px rgba(2, 132, 199, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0369A1' }}>Active Commitments</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(2, 132, 199, 0.3)' }}>
                    <Layers size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0C4A6E', marginTop: '6px' }}>
                  {activeCommitmentsCount} / {totalCommitmentsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284C7', marginTop: '2px', fontWeight: 500 }}>
                  {activeCommitmentPct}% active in {selectedYear}
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#BAE6FD', borderRadius: '9999px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${activeCommitmentPct}%`, height: '100%', background: 'linear-gradient(90deg, #0284C7, #38BDF8)', borderRadius: '9999px' }} />
              </div>
            </Link>

            {/* Pending Commitments */}
            <Link
              href={`/dashboard/commitments?status=PENDING&year=${selectedYear}`}
              className="dashboard-clickable-card"
              title={`View pending commitments for ${selectedYear}`}
              style={{
                background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #FDE68A',
                boxShadow: '0 4px 14px -2px rgba(217, 119, 70, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400E' }}>Pending Commitments</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #D97746 0%, #B45309 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(217, 119, 70, 0.3)' }}>
                    <Clock size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#78350F', marginTop: '6px' }}>
                  {pendingCommitmentsCount} / {totalCommitmentsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '2px', fontWeight: 500 }}>
                  {pendingCommitmentsCount === 0 ? 'All commitments confirmed' : `${pendingCommitmentsCount} awaiting confirmation`}
                </div>
              </div>
            </Link>

            {/* Active Members */}
            <Link
              href="/dashboard/users?status=ACTIVE"
              className="dashboard-clickable-card"
              title="View active members"
              style={{
                background: 'linear-gradient(145deg, #F0FDF4 0%, #D1FAE5 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #A7F3D0',
                boxShadow: '0 4px 14px -2px rgba(16, 185, 129, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065F46' }}>Active Members</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(5, 150, 105, 0.3)' }}>
                    <Users size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#064E3B', marginTop: '6px' }}>
                  {activeUsersCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px', fontWeight: 500 }}>
                  {invitedUsersCount > 0 ? `${invitedUsersCount} awaiting activation` : 'All members active'}
                </div>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#A7F3D0', borderRadius: '9999px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.round((activeUsersCount / (activeUsersCount + invitedUsersCount || 1)) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #34D399)', borderRadius: '9999px' }} />
              </div>
            </Link>

            {/* Invited Members */}
            <Link
              href="/dashboard/users?status=INVITED"
              className="dashboard-clickable-card"
              title="View invited members"
              style={{
                background: 'linear-gradient(145deg, #FAF5FF 0%, #F3E8FF 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #E9D5FF',
                boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B21A8' }}>Invited Members</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(124, 58, 237, 0.3)' }}>
                    <UserPlus size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#4C1D95', marginTop: '6px' }}>
                  {invitedUsersCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7C3AED', marginTop: '2px', fontWeight: 500 }}>
                  {invitedUsersCount > 0 ? 'Pending platform activation' : 'No pending invitations'}
                </div>
              </div>
            </Link>
          </>
        ) : (
          <>
            {/* Member Card 1: My Active Commitments */}
            <Link
              href="/dashboard/commitments"
              className="dashboard-clickable-card"
              title="View my savings commitments"
              style={{
                background: 'linear-gradient(145deg, #F0F9FF 0%, #E0F2FE 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #BAE6FD',
                boxShadow: '0 4px 14px -2px rgba(2, 132, 199, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0369A1' }}>Active Commitments</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(2, 132, 199, 0.3)' }}>
                    <Layers size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0C4A6E', marginTop: '6px' }}>
                  {activeCommitmentsCount} / {totalCommitmentsCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0284C7', marginTop: '2px', fontWeight: 500 }}>
                  {activeCommitmentsCount > 0 ? `${activeCommitmentsCount} savings pool(s) active` : 'No active commitments'}
                </div>
              </div>
            </Link>

            {/* Member Card 2: Fixed Monthly Contribution (Not Target) */}
            <Link
              href="/dashboard/commitments"
              className="dashboard-clickable-card"
              title="View my monthly contributions"
              style={{
                background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #FDE68A',
                boxShadow: '0 4px 14px -2px rgba(217, 119, 70, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400E' }}>Monthly Contribution</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #D97746 0%, #B45309 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(217, 119, 70, 0.3)' }}>
                    <CreditCard size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#78350F', marginTop: '6px' }}>
                  £{yearCommitments.reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '2px', fontWeight: 500 }}>
                  Fixed monthly contribution
                </div>
              </div>
            </Link>

            {/* Member Card 3: Next Payout Date */}
            <Link
              href="/dashboard/commitments"
              className="dashboard-clickable-card"
              title="View my payout schedule"
              style={{
                background: 'linear-gradient(145deg, #FAF5FF 0%, #F3E8FF 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #E9D5FF',
                boxShadow: '0 4px 14px -2px rgba(124, 58, 237, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B21A8' }}>Next Harvest Payout</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(124, 58, 237, 0.3)' }}>
                    <CalendarRange size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4C1D95', marginTop: '6px' }}>
                  {yearCommitments[0]?.collectionMonth || 'December'} {selectedYear}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7C3AED', marginTop: '2px', fontWeight: 500 }}>
                  Scheduled payout month
                </div>
              </div>
            </Link>

            {/* Member Card 4: Invite Friends */}
            <Link
              href="/dashboard/invitations"
              className="dashboard-clickable-card"
              title="Invite friends to Savvey Savers"
              style={{
                background: 'linear-gradient(145deg, #FFF1F2 0%, #FFE4E6 100%)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px solid #FECDD3',
                boxShadow: '0 4px 14px -2px rgba(225, 29, 72, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '135px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9F1239' }}>Refer a Friend</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 3px 8px rgba(225, 29, 72, 0.3)' }}>
                    <UserPlus size={16} />
                  </div>
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#881337', marginTop: '6px' }}>
                  Invite & Share
                </div>
                <div style={{ fontSize: '0.75rem', color: '#E11D48', marginTop: '2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Refer friends & family</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* 4. Visuals: Savings Volume Over Time + At a Glance */}
      <div className="dashboard-two-col-grid" style={{
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-family-title)', margin: 0 }}>
                {isAdmin ? 'Savings Volume Over Time' : 'My Monthly Contributions'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '3px' }}>
                {isAdmin
                  ? `Actual confirmed collections across months for ${selectedYear}`
                  : `Your confirmed savings payments across months for ${selectedYear}`}
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
          boxShadow: '0 10px 25px -4px rgba(12, 78, 67, 0.35)',
          minWidth: 0,
          maxWidth: '100%',
          boxSizing: 'border-box'
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
            {activeCommitmentsCount} Active Commitment{activeCommitmentsCount === 1 ? '' : 's'}
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
            {isAdmin
              ? `${activeUsersCount} active verified members participating in cycle.`
              : (activeCommitmentsCount > 0
                  ? 'Your personal savings cycle is active and on track.'
                  : 'Start or join a savings pool today.')}
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
              {isAdmin
                ? (invitedUsersCount > 0
                    ? `${invitedUsersCount} pending action item${invitedUsersCount > 1 ? 's' : ''}`
                    : 'All accounts and contributions are fully up to date')
                : (activeCommitmentsCount > 0
                    ? 'Your savings contributions and account status are in good standing'
                    : 'Get started by exploring available savings commitments')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: '#57655c' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0c4e43' }} />
              <span>0 overdue payments</span>
            </div>
            {isAdmin && invitedUsersCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97746' }} />
                <span>{invitedUsersCount} member invitation{invitedUsersCount > 1 ? 's' : ''} awaiting activation</span>
              </div>
            )}
          </div>
        </div>

        <Link
          href={isAdmin ? (invitedUsersCount > 0 ? "/dashboard/users?status=INVITED" : "/dashboard/commitments") : "/dashboard/commitments"}
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
          <span>{isAdmin ? (invitedUsersCount > 0 ? "Review Invitations" : "View Commitments") : "View My Commitments"}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 6. Recent Activity & Commitment Overview */}
      <div className="dashboard-activity-grid" style={{
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-family-title)', margin: 0 }}>
                {isAdmin ? 'Recent Activity' : 'My Recent Payments'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#57655c', marginTop: '3px' }}>
                {isAdmin ? 'Live ledger transactions from the database' : 'Your confirmed contribution payment receipts'}
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
                  <Link
                    key={p.id}
                    href={`/dashboard/payments?id=${p.id}`}
                    className="activity-item-link"
                    title={`View payment record for ${memberName}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      borderBottom: '1px solid #F5F3EF',
                      cursor: 'pointer'
                    }}
                  >
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
                  </Link>
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
          justifyContent: 'space-between',
          minWidth: 0,
          maxWidth: '100%'
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
