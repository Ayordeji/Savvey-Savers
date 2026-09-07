'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Gift,
  Share2,
  FileBarChart,
  FileText,
  Star,
  Settings,
  Bell,
  Headphones,
  X,
  LogOut,
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

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleOpenModal = (type: 'AGREEMENT' | 'FEE_SCHEDULE') => {
    window.dispatchEvent(new CustomEvent('open-resource-modal', { detail: { type } }));
  };

  const REVIEWS_URL = "https://www.google.com/search?authuser=0&hl=en&sca_esv=90e47ce38a807d1a&cs=0&output=search&q=Savvey+Savers+Network+Limited&ludocid=1723843643196866088&lsig=AB86z5WYdK-LdT3ollfvufAR3Jnz&kgs=4f2c1844f9ffd9f9&shndl=-1&shem=lsp&source=sh/x/loc/hdr/m1/2#lrd=0x47d89d1601cae061:0x17ec52a901107e28,1,,,,";

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

  // Main navigation items matching client screenshots
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/dashboard/users', icon: Users },
    { name: 'Savings Commitments', href: '/dashboard/commitments', icon: CalendarCheck },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Harvests', href: '/dashboard/reports/commitments?harvest=YES', icon: Gift },
    { name: 'Invitations', href: '/dashboard/invitations', icon: Share2 },
    { name: 'Reports', href: '/dashboard/reports/members', icon: FileBarChart },
  ];

  const navContent = (
    <>
      {/* Brand Header */}
      <div className={styles.sidebarHeader} style={{ justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Gold Monogram Icon */}
          <div style={{
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DFC07B" />
                  <stop offset="50%" stopColor="#C59A52" />
                  <stop offset="100%" stopColor="#9C722D" />
                </linearGradient>
              </defs>
              <path
                d="M12 28C10 24 10 18 16 14C21 11 25 10 28 8M28 12C30 16 30 22 24 26C19 29 15 30 12 32"
                stroke="url(#goldGradient)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M16 8C20 8 26 12 26 18C26 23 20 25 16 26"
                stroke="url(#goldGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M24 32C20 32 14 28 14 22C14 17 20 15 24 14"
                stroke="url(#goldGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#111827',
              fontFamily: 'var(--font-family-serif)',
              lineHeight: 1.1
            }}>
              SAVVEY
            </span>
            <span style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#9ca3af',
              textTransform: 'uppercase',
              lineHeight: 1.3
            }}>
              SAVERS NETWORKS
            </span>
          </div>
        </Link>

        <button
          onClick={() => setIsMobileOpen(false)}
          className="mobile-drawer-close-btn"
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav className={styles.navSection}>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || (item.href.includes('?') ? pathname === item.href.split('?')[0] : pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
            >
              <Icon size={18} style={{ color: isActive ? '#111827' : '#6b7280' }} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* RESOURCES CATEGORY */}
        <div className={styles.navSectionHeader}>RESOURCES</div>
        
        <button
          onClick={() => { handleOpenModal('AGREEMENT'); setIsMobileOpen(false); }}
          className={styles.navItem}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FileText size={18} style={{ color: '#6b7280' }} />
          <span>Membership Agreement</span>
        </button>

        <button
          onClick={() => { handleOpenModal('FEE_SCHEDULE'); setIsMobileOpen(false); }}
          className={styles.navItem}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FileText size={18} style={{ color: '#6b7280' }} />
          <span>Fee Schedule</span>
        </button>

        <a
          href={REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navItem}
        >
          <Star size={18} style={{ color: '#6b7280' }} />
          <span>Reviews</span>
        </a>

        {/* SETTINGS CATEGORY */}
        <div className={styles.navSectionHeader}>SETTINGS</div>

        <Link
          href="/dashboard/settings"
          onClick={() => setIsMobileOpen(false)}
          className={`${styles.navItem} ${pathname.startsWith('/dashboard/settings') ? styles.activeNavItem : ''}`}
        >
          <Settings size={18} style={{ color: pathname.startsWith('/dashboard/settings') ? '#111827' : '#6b7280' }} />
          <span>Account Settings</span>
        </Link>

        <Link
          href="/dashboard/notifications"
          onClick={() => setIsMobileOpen(false)}
          className={`${styles.navItem} ${pathname.startsWith('/dashboard/notifications') ? styles.activeNavItem : ''}`}
        >
          <Bell size={18} style={{ color: pathname.startsWith('/dashboard/notifications') ? '#111827' : '#6b7280' }} />
          <span>Notification Settings</span>
        </Link>
      </nav>

      {/* Need Help? Box */}
      <div className={styles.sidebarHelpCard}>
        <div className={styles.sidebarHelpTitle}>Need help?</div>
        <div className={styles.sidebarHelpText}>Visit our help centre or contact support.</div>
        <a
          href="mailto:support@savveysavers.com"
          className={styles.sidebarHelpBtn}
          style={{ textDecoration: 'none' }}
        >
          <Headphones size={15} />
          <span>Get Support</span>
        </a>
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
            borderTop: '3px solid #2e5a44',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500 }}>
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
          <aside className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#faf9f6' }}>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
