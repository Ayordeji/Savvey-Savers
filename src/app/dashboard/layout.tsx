import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import Sidebar from './Sidebar';
import HeaderTitle from './HeaderTitle';
import styles from './layout.module.css';
import Link from 'next/link';
import { Bell } from 'lucide-react';

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
      <Sidebar user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership
      }} />

      <main className={styles.mainContent}>
        <header className={styles.headerBar}>
          <HeaderTitle />
          <div className={styles.headerActions}>
            <Link
              href="/dashboard/notifications"
              className={styles.notificationBell}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <div className={styles.pageBody}>
          {children}
        </div>
      </main>
    </div>
  );
}
