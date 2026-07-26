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

  const user = await db.users.findUnique({ where: { id: payload.id } });
  if (!user) {
    redirect('/');
  }

  // Count unread notifications
  const unreadNotifications = await db.notifications.findMany(
    (n) => n.userId === user.id && !n.isRead
  );
  const unreadCount = unreadNotifications.length;

  return (
    <div className={styles.dashboardContainer}>
      <DashboardTransitionLoader />
      <Sidebar user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership
      }} />

      <main className={styles.mainContent}>
        <GlobalHeader
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            membership: user.membership,
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
