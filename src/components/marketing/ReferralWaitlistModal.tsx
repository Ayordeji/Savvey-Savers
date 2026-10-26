'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import WaitlistModal from './WaitlistModal';

export default function ReferralWaitlistModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referrerId = searchParams.get('ref');

  if (!referrerId) return null;

  return (
    <WaitlistModal
      key={referrerId}
      isOpen
      onClose={() => router.replace('/')}
      initialReferrer={referrerId}
    />
  );
}
