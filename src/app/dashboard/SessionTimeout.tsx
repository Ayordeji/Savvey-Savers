'use client';

import { useEffect, useRef, useCallback } from 'react';

// 30 Minutes Inactivity Timeout (in milliseconds)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const STORAGE_KEY = 'savvey_last_active';

export default function SessionTimeout() {
  const isLoggingOutRef = useRef(false);
  const lastWriteTimeRef = useRef(0);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      localStorage.removeItem(STORAGE_KEY);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Auto logout error:', e);
    } finally {
      window.location.href = '/login?sessionExpired=true';
    }
  }, []);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    // Throttle localStorage updates to at most once every 3 seconds
    if (now - lastWriteTimeRef.current > 3000) {
      lastWriteTimeRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Ignore quota/private browsing errors
      }
    }
  }, []);

  const checkInactivity = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Initialize if not present
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        return;
      }
      const lastActive = Number(stored);
      if (lastActive && Date.now() - lastActive > IDLE_TIMEOUT_MS) {
        performLogout();
      }
    } catch {
      // Fallback
    }
  }, [performLogout]);

  useEffect(() => {
    // 1. Check immediately on mount (e.g. if tab is opened next day or revived)
    checkInactivity();

    // 2. Setup user activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => {
      recordActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // 3. Check immediately when tab becomes visible or receives focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 4. Synchronize across multiple browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue === null) {
        // Another tab logged out
        window.location.href = '/login?sessionExpired=true';
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 5. Periodic heartbeat check every 10 seconds
    const intervalId = setInterval(() => {
      checkInactivity();
    }, 10000);

    return () => {
      clearInterval(intervalId);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkInactivity, recordActivity]);

  return null;
}
