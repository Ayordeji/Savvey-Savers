'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  FileSpreadsheet,
  Settings,
  Trash2,
  Mail,
  LogOut,
  UserCheck,
  Bell
} from 'lucide-react';
import styles from './layout.module.css';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    membership?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Navigation Links based on User Role
  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/dashboard/users', icon: Users },
    { name: 'Savings Commitments', href: '/dashboard/commitments', icon: PiggyBank },
    { name: 'Submitted Requests', href: '/dashboard/requests', icon: FileSpreadsheet },
    { name: 'Waiting List', href: '/dashboard/waiting-list', icon: UserCheck },
    { name: 'Deleted Records', href: '/dashboard/deleted-records', icon: Trash2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Mock Mailbox', href: '/dashboard/mock-mailbox', icon: Mail },
  ];

  const memberLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Savings Commitments', href: '/dashboard/commitments', icon: PiggyBank },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : memberLinks;

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader} style={{ gap: '10px' }}>
        <img
          src="/logo_new-removebg-preview.png"
          alt="Savvey Savers"
          style={{
            width: '36px',
            height: '36px',
            objectFit: 'contain',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            padding: '4px',
            flexShrink: 0
          }}
        />
        <span className={styles.logoText} style={{ color: '#ffffff', fontFamily: 'var(--font-family-title)', fontSize: '1.25rem', fontWeight: 700 }}>Savvey Savers</span>
      </div>

      <nav className={styles.navSection}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.userInfo} style={{ paddingLeft: '12px' }}>
          <div className={styles.userDetails}>
            <span className={styles.userName} style={{ color: 'var(--sidebar-text)', fontSize: '0.85rem' }}>{user.email}</span>
            <span className={styles.userRole} style={{ color: '#84a993', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{user.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn} style={{ marginTop: '12px', border: 'none', background: 'none', cursor: 'pointer' }}>
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
