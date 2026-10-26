'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * /join — legacy invitation entry-point.
 *
 * Invitation links sent to members were originally generated as:
 *   /join?ref=<displayId | userId>
 *
 * The actual activation flow lives at /activate.
 * This page silently redirects so existing shared/emailed links keep working.
 */
function JoinRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Accept ref, invite, token, code — pass whichever is present
    const ref = searchParams.get('ref') || searchParams.get('invite') || searchParams.get('token') || searchParams.get('code');
    if (ref) {
      router.replace(`/activate?invite=${encodeURIComponent(ref)}`);
    } else {
      // No token — send to home
      router.replace('/');
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F1E8',
        fontFamily: 'var(--font-family-body, sans-serif)',
      }}
    >
      <div style={{ textAlign: 'center', color: '#6B7280' }}>
        <p style={{ fontSize: '1rem', margin: 0 }}>Redirecting you to your account setup…</p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1E8' }}>
        <p style={{ color: '#6B7280' }}>Loading…</p>
      </div>
    }>
      <JoinRedirect />
    </Suspense>
  );
}
