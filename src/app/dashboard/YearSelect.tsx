'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

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
    <div className="year-select-container">
      <select
        value={selectedYear}
        onChange={handleYearChange}
        className="year-select-dropdown"
        aria-label="Select savings cycle year"
      >
        <option value="2026">2026</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
      </select>
      <div className="year-select-chevron">
        <ChevronDown size={14} />
      </div>
    </div>
  );
}
