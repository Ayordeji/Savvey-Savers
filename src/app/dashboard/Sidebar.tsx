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
  ChevronRight,
  Clock,
  Trash2
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

  // Main navigation items matching client application
  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/dashboard/users', icon: Users },
    { name: 'Savings Commitments', href: '/dashboard/commitments', icon: CalendarCheck },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Harvests', href: '/dashboard/reports/commitments?harvest=YES', icon: Gift },
    { name: 'Waiting List', href: '/dashboard/waiting-list', icon: Clock },
    { name: 'Invitations', href: '/dashboard/invitations', icon: Share2 },
    { name: 'Deleted Records', href: '/dashboard/deleted-records', icon: Trash2 },
    { name: 'Reports', href: '/dashboard/reports/members', icon: FileBarChart },
  ];

  const navContent = (
    <>
      {/* Brand Header */}
      <div className={styles.sidebarHeader} style={{ justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo_new-removebg-preview.png"
            alt="Savvey Savers Logo"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              padding: '4px',
              flexShrink: 0
            }}
          />
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#ffffff',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1.1
          }}>
            Savvey Savers
          </span>
        </Link>

        <button
          onClick={() => setIsMobileOpen(false)}
          className="mobile-drawer-close-btn"
          style={{ background: 'none', border: 'none', color: '#8fa89b', cursor: 'pointer', padding: '4px' }}
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
              <Icon size={18} style={{ color: isActive ? '#ffffff' : '#8fa89b' }} />
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
          <FileText size={18} style={{ color: '#8fa89b' }} />
          <span>Membership Agreement</span>
        </button>

        <button
          onClick={() => { handleOpenModal('FEE_SCHEDULE'); setIsMobileOpen(false); }}
          className={styles.navItem}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <FileText size={18} style={{ color: '#8fa89b' }} />
          <span>Fee Schedule</span>
        </button>

        <a
          href={REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navItem}
        >
          <Star size={18} style={{ color: '#8fa89b' }} />
          <span>Reviews</span>
        </a>

        {/* SETTINGS CATEGORY */}
        <div className={styles.navSectionHeader}>SETTINGS</div>

        <Link
          href="/dashboard/settings"
          onClick={() => setIsMobileOpen(false)}
          className={`${styles.navItem} ${pathname.startsWith('/dashboard/settings') ? styles.activeNavItem : ''}`}
        >
          <Settings size={18} style={{ color: pathname.startsWith('/dashboard/settings') ? '#ffffff' : '#8fa89b' }} />
          <span>Account Settings</span>
        </Link>

        <Link
          href="/dashboard/notifications"
          onClick={() => setIsMobileOpen(false)}
          className={`${styles.navItem} ${pathname.startsWith('/dashboard/notifications') ? styles.activeNavItem : ''}`}
        >
          <Bell size={18} style={{ color: pathname.startsWith('/dashboard/notifications') ? '#ffffff' : '#8fa89b' }} />
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
            borderTop: '3px solid #0c4e43',
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
          <aside className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#090e0c' }}>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
