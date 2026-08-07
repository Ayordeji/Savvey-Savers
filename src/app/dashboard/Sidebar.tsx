'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  Settings,
  Trash2,
  LogOut,
  UserCheck,
  Bell,
  X,
  ClipboardList,
  PieChart,
  ChevronDown,
  ChevronRight
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  interface NavLink {
    name: string;
    href?: string;
    icon: any;
    subLinks?: { name: string; href: string }[];
  }

  // Navigation Links based on User Role
  const adminLinks: NavLink[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manage Users', href: '/dashboard/users', icon: Users },
    { name: 'Savings Commitments', href: '/dashboard/commitments', icon: PiggyBank },
    { name: 'Waiting List', href: '/dashboard/waiting-list', icon: UserCheck },
    { name: 'My Invitations', href: '/dashboard/invitations', icon: UserPlus },
    { name: 'Deleted Records', href: '/dashboard/deleted-records', icon: Trash2 },
    { 
      name: 'Report', 
      icon: PieChart, 
      subLinks: [
        { name: 'Member Report', href: '/dashboard/reports/members' },
        { name: 'Saving Commitment Report', href: '/dashboard/reports/commitments' }
      ]
    },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ];

  const memberLinks: NavLink[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Savings Commitments', href: '/dashboard/commitments', icon: PiggyBank },
    { name: 'My Invitations', href: '/dashboard/invitations', icon: UserCheck },
    { name: 'Collection Month Requests', href: '/dashboard/requests', icon: ClipboardList },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : memberLinks;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        setIsLoggingOut(false);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  const navContent = (
    <>
      <div className={styles.sidebarHeader} style={{ gap: '10px', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        <button
          onClick={() => setIsMobileOpen(false)}
          className="mobile-drawer-close-btn"
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      <nav className={styles.navSection}>
        {links.map((link) => {
          const Icon = link.icon;
          
          if (link.subLinks) {
            const isDropdownOpen = openDropdowns[link.name];
            const isAnySubLinkActive = link.subLinks.some(sub => pathname === sub.href);
            return (
              <div key={link.name}>
                <button
                  onClick={() => toggleDropdown(link.name)}
                  className={`${styles.navItem} ${isAnySubLinkActive ? styles.activeNavItem : ''}`}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </div>
                  {isDropdownOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {isDropdownOpen && (
                  <div style={{ paddingLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {link.subLinks.map(sub => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`${styles.navItem} ${isSubActive ? styles.activeNavItem : ''}`}
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = link.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname === link.href || pathname.startsWith(link.href + '/');

          return (
            <Link
              key={link.href!}
              href={link.href!}
              onClick={() => setIsMobileOpen(false)}
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
            <span className={styles.userName} style={{ color: 'var(--sidebar-text)', fontSize: '0.85rem', fontWeight: 600, display: 'block' }}>{user.name || 'User'}</span>
            <span className={styles.userEmail} style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.75rem', marginTop: '2px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            <span className={styles.userRole} style={{ color: '#84a993', fontSize: '0.72rem', marginTop: '2px', display: 'block' }}>{user.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn} style={{ marginTop: '12px', border: 'none', background: 'none', cursor: 'pointer' }}>
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {isLoggingOut && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          color: 'white',
        }}>
          <div className="loading-spinner" style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTop: '3px solid var(--primary, #3b82f6)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.05em' }}>
            Signing out...
          </p>
        </div>
      )}

      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className={`desktop-sidebar ${styles.sidebar}`}>
        {navContent}
      </aside>

      {/* Mobile Slide-Out Drawer Panel (< 1024px) */}
      {isMobileOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileOpen(false)}>
          <aside className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
