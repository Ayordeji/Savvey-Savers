'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface YearSelectProps {
  selectedYear: string;
}

export default function YearSelect({ selectedYear }: YearSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('year', year);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/dashboard${query}`);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={selectedYear}
        onChange={handleYearChange}
        style={{
          appearance: 'none',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 36px 8px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          cursor: 'pointer',
          fontFamily: 'var(--font-family-body)',
          outline: 'none',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color var(--transition-fast)'
        }}
      >
        <option value="2026">2026</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
      </select>
      <div style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: 'var(--text-muted)',
        fontSize: '0.65rem'
      }}>
        ▼
      </div>
    </div>
  );
}
