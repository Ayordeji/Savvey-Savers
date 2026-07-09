'use client';

import { usePathname } from 'next/navigation';

export default function HeaderTitle() {
  const pathname = usePathname();

  const getTitle = (path: string) => {
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/dashboard/users')) return 'Manage Users';
    if (path.startsWith('/dashboard/commitments-report') || path.startsWith('/dashboard/report')) return 'Commitments Report';
    if (path.startsWith('/dashboard/commitments')) return 'Savings Commitments';
    if (path.startsWith('/dashboard/requests')) return 'Submitted Requests';
    if (path.startsWith('/dashboard/notifications')) return 'Notifications';
    if (path.startsWith('/dashboard/waiting-list')) return 'Waiting List';
    if (path.startsWith('/dashboard/deleted-records') || path.startsWith('/dashboard/deleted')) return 'Deleted Records';
    if (path.startsWith('/dashboard/settings')) return 'Settings';
    if (path.startsWith('/dashboard/mock-mailbox')) return 'Mock Mailbox';
    return 'Dashboard';
  };

  return (
    <span style={{
      fontSize: '1.5rem',
      fontWeight: 700,
      fontFamily: 'var(--font-family-title)',
      color: 'var(--text-main)',
      letterSpacing: '-0.02em'
    }}>
      {getTitle(pathname)}
    </span>
  );
}
