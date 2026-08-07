import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import Sidebar from './Sidebar';
import HeaderTitle from './HeaderTitle';
import DashboardTransitionLoader from './TransitionLoader';
import styles from './layout.module.css';
import Link from 'next/link';
import GlobalHeader from './GlobalHeader';
import SessionTimeout from './SessionTimeout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  const payload = await verifyToken(token!);
  if (!payload) {
    // Delete the stale/invalid cookie so the browser doesn't loop
    cookieStore.delete(COOKIE_NAME);
    redirect('/');
  }


  let user: any = null;
  let unreadCount = 0;

  try {
    user = await db.user.findUnique({ where: { id: payload.id } });
    if (!user && payload.email) {
      user = await db.user.findUnique({ where: { email: payload.email } });
    }
  } catch (dbErr: any) {
    if (dbErr?.digest === 'NEXT_REDIRECT' || dbErr?.message?.includes('NEXT_REDIRECT')) {
      throw dbErr;
    }
    console.error('DashboardLayout user query error:', dbErr);
  }

  if (!user) {
    redirect('/');
  }

  try {
    const unreadNotifications = await db.notification.findMany({
      where: { userId: user.id, isRead: false }
    });
    unreadCount = unreadNotifications.length;
  } catch (notifErr) {
    console.warn('DashboardLayout notification query error:', notifErr);
  }

  return (
    <div className={styles.dashboardContainer}>
      <SessionTimeout />
      <DashboardTransitionLoader />
      <Sidebar user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'ADMIN' | 'MEMBER',
        membership: user.membership || undefined
      }} />

      <main className={styles.mainContent}>
        <GlobalHeader
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as 'ADMIN' | 'MEMBER',
            membership: user.membership || undefined,
            displayId: (user as any).displayId || user.id
          }}
          unreadCount={unreadCount}
        />

        <div className={styles.pageBody}>
          {children}
        </div>
      </main>
    </div>
  );
}
