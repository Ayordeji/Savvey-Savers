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

  const payload = await verifyToken(token);
  if (!payload) {
    redirect('/');
  }

  let user = await db.user.findUnique({ where: { id: payload.id } });
  
  if (!user && payload.email) {
    user = await db.user.findUnique({ where: { email: payload.email } });
  }

  if (!user) {
    redirect('/');
  }

  // Count unread notifications
  const unreadNotifications = await db.notification.findMany({
    where: { userId: user.id, isRead: false }
  });
  const unreadCount = unreadNotifications.length;

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
