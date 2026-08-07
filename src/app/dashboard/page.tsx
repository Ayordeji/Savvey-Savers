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
  AlertCircle,
  PoundSterling
} from 'lucide-react';
import MemberCommitmentsCarousel from './MemberCommitmentsCarousel';

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

  // --- QUERY & METRICS COMPUTATION ---
  let allTimeRevenue = 0;
  let revenueForYear = 0;
  let activeCommitmentsCount = 0;
  let pendingCommitmentsCount = 0;
  let notStartedCommitmentsCount = 0;
  let completedCommitmentsCount = 0;
  let totalCommitmentsCount = 0;
  let activeUsersCount = 0;
  let invitedUsersCount = 0;
  let harvestReleasedTotal = 0; // Total £ amount of all released harvests
  let memberActiveCommitmentsList: any[] = [];

  // Monthly values for chart (Jan - Dec)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthlyData = Array(12).fill(0);

  const currentRealYear = 2026; // System base year

  if (isAdmin) {
    try {
      // Admin: Dynamic aggregation from live imported database records
      const allCommitments = await db.commitment.findMany();
      const allPayments = await db.payment.findMany({ where: { status: 'CONFIRMED' } });
      const rawUsers = await db.user.findMany();

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

      // 2. All-Time Revenue = sum of all CONFIRMED savings commitment payments
      allTimeRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);

      // 3. Filter commitments by selected collection year and apply dynamic status overrides
      const selectedYearInt = parseInt(selectedYear, 10) || currentRealYear;
      const yearCommitments = allCommitments.filter((c) => Number(c.collectionYear) === selectedYearInt).map(c => {
        let dynamicStatus = c.status;
        if (dynamicStatus !== 'CANCELLED') {
          if (c.collectionYear < currentRealYear) {
            dynamicStatus = 'COMPLETED';
          } else if (c.collectionYear > currentRealYear) {
            dynamicStatus = 'NOT_YET_STARTED';
          } else if (!dynamicStatus || dynamicStatus === 'COMPLETED' || dynamicStatus === 'NOT_YET_STARTED') {
            dynamicStatus = 'ACTIVE';
          }
        }
        return { ...c, status: dynamicStatus };
      });
      totalCommitmentsCount = yearCommitments.length;

      // 4. Status counts for selected year
      activeCommitmentsCount = yearCommitments.filter((c) => c.status === 'ACTIVE').length;
      pendingCommitmentsCount = yearCommitments.filter((c) => c.status === 'PENDING').length;
      completedCommitmentsCount = yearCommitments.filter((c) => c.status === 'COMPLETED').length;

      // Harvest Released Total — sum of actual harvestAmount from all released commitments
      harvestReleasedTotal = allCommitments
        .filter((c) => c.harvestReleasedAt !== null && c.harvestReleasedAt !== undefined && (c as any).harvestAmount)
        .reduce((acc, c) => acc + ((c as any).harvestAmount || 0), 0);

      // 5. Revenue for selected year = confirmed payments on commitments in that year
      const yearCommitmentIds = new Set(yearCommitments.map((c) => c.id));
      const yearPayments = allPayments.filter((p) => yearCommitmentIds.has(p.commitmentId) && (p as any).year === selectedYearInt);
      revenueForYear = yearPayments.reduce((acc, p) => acc + p.amount, 0);

      // 6. Monthly Distribution — confirmed payments by month for selected year
      months.forEach((m, idx) => {
        const monthPayments = yearPayments.filter((p) => (p as any).month.trim() === m);
        monthlyData[idx] = monthPayments.reduce((acc, p) => acc + p.amount, 0);
      });
    } catch (err) {
      console.error('Dashboard metrics error:', err);
    }
  } else {
    try {
      // MEMBER METRICS
      // 1. Savings Count
      const memberCommitments = await db.commitment.findMany({ where: { memberId: user.id } });
      totalCommitmentsCount = memberCommitments.length;

      // Find the most recent active commitment for Amount, Goal, and Month
      const activeCommitments = memberCommitments.map(c => {
        let dynamicStatus = c.status;
        if (dynamicStatus !== 'CANCELLED') {
          if (c.collectionYear < currentRealYear) {
            dynamicStatus = 'COMPLETED';
          } else if (c.collectionYear > currentRealYear) {
            dynamicStatus = 'NOT_YET_STARTED';
          } else if (!dynamicStatus || dynamicStatus === 'COMPLETED' || dynamicStatus === 'NOT_YET_STARTED') {
            dynamicStatus = 'ACTIVE';
          }
        }
        return { ...c, status: dynamicStatus };
      }).filter(c => c.status === 'ACTIVE' || c.status === 'PENDING');
      activeCommitments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Pass all active commitments to the carousel
      memberActiveCommitmentsList = activeCommitments.map(c => ({
        id: c.id,
        amount: c.amount,
        goal: c.goal,
        collectionMonth: c.collectionMonth,
        collectionYear: c.collectionYear
      }));

      // Total Invitations
      const userKeys = [user.id, user.displayId, user.invitationId, user.email].filter(Boolean);
      invitedUsersCount = await db.user.count({ where: { invitedBy: { in: userKeys as string[] } } });

      // Harvest to Date
      harvestReleasedTotal = memberCommitments
        .filter((c) => c.harvestReleasedAt !== null && c.harvestReleasedAt !== undefined && (c as any).harvestAmount)
        .reduce((acc, c) => acc + ((c as any).harvestAmount || 0), 0);

      // Total Saved to Date
      const memberPayments = await db.payment.findMany({ 
        where: { userId: user.id, status: 'CONFIRMED' } 
      });
      allTimeRevenue = memberPayments.reduce((acc, p) => acc + p.amount, 0);

    } catch (err) {
      console.error('Member dashboard metrics error:', err);
    }
  }

  const selectedYearInt = parseInt(selectedYear, 10) || currentRealYear;
  const isPreviousYear = selectedYearInt < currentRealYear;
  
  // Dynamic Card Logic for Active vs Completed based on Year
  const dynamicCardTitle = isPreviousYear ? 'Completed Commitments' : 'Active Commitments';
  const dynamicCardLink = isPreviousYear ? `/dashboard/commitments?status=COMPLETED&year=${selectedYear}` : `/dashboard/commitments?status=ACTIVE&year=${selectedYear}`;
  const dynamicCardCount = isPreviousYear ? completedCommitmentsCount : activeCommitmentsCount;

  // --- SVG CHART PARAMETERS ---
  const chartHeight = 180;
  const chartWidth = 700;
  const maxVal = Math.max(...monthlyData, 1000); // minimum scale limit
  const barWidth = 36;
  const gap = 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Summary Cards Grid (6 Cards Interactive) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        width: '100%'
      }} className="dashboard-cards-grid">
        {isAdmin ? (
          <>
            {/* Card 1: Revenue to date (All-Time) */}
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
                    £{allTimeRevenue.toFixed(2)}
                  </h3>
                </div>
              </div>
            </Link>

            {/* Card 2: Revenue for Selected Year */}
            <Link href={`/dashboard/commitments?year=${selectedYear}`} style={{ textDecoration: 'none', display: 'block' }}>
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
                  <Briefcase size={28} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>
                    Revenue for {selectedYear}
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
                    £{revenueForYear.toFixed(2)}
                  </h3>
                </div>
              </div>
            </Link>

            {/* Card 3: Pending Commitments -> Links to PENDING Commitments */}
            <Link href={`/dashboard/commitments?status=PENDING&year=${selectedYear}`} style={{ textDecoration: 'none', display: 'block' }}>
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

            {/* Card 4: Dynamic Active/Completed Commitments */}
            <Link href={dynamicCardLink} style={{ textDecoration: 'none', display: 'block' }}>
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
                    {dynamicCardTitle}
                  </span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: '#ffffff', margin: 0 }}>
                    {`${dynamicCardCount} / ${totalCommitmentsCount}`}
                  </h3>
                </div>
              </div>
            </Link>

            {/* Card 5: Harvests Released -> Links to reports where harvest is pending */}
            <Link href="/dashboard/reports/commitments?harvest=NO" style={{ textDecoration: 'none', display: 'block' }}>
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
                    £{harvestReleasedTotal.toFixed(2)}
                  </h3>
                </div>
              </div>
            </Link>

            {/* Card 6: Active vs Invited -> Links to Manage Users */}
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
          </>
        ) : (
          <>
            {/* MEMBER CARDS */}
            <Link href="/dashboard/commitments" style={{ textDecoration: 'none', display: 'block' }}>
              <MemberCommitmentsCarousel commitments={memberActiveCommitmentsList} />
            </Link>

            <div style={{
              backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px 28px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'row', alignItems: 'center',
              gap: '20px', minHeight: '130px', color: '#ffffff'
            }} className="dashboard-interactive-card">
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={28} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>Total Invitations</span>
                <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', margin: 0, color: '#ffffff' }}>{invitedUsersCount}</h3>
              </div>
            </div>

            <div style={{
              backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px 28px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'row', alignItems: 'center',
              gap: '20px', minHeight: '130px', color: '#ffffff'
            }} className="dashboard-interactive-card">
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Gift size={28} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>Harvest to Date</span>
                <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', margin: 0, color: '#ffffff' }}>£{harvestReleasedTotal.toFixed(2)}</h3>
              </div>
            </div>

            <div style={{
              backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px 28px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'row', alignItems: 'center',
              gap: '20px', minHeight: '130px', color: '#ffffff'
            }} className="dashboard-interactive-card">
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PiggyBank size={28} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 600, letterSpacing: '0.01em' }}>Total Saved to Date</span>
                <h3 style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', margin: 0, color: '#ffffff' }}>£{allTimeRevenue.toFixed(2)}</h3>
              </div>
            </div>
          </>
        )}
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
