'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MonthlyRevenueChartProps {
  monthlyData: number[];
  months: string[];
  selectedYear?: string;
}

export default function MonthlyRevenueChart({
  monthlyData,
  months,
  selectedYear = '2026'
}: MonthlyRevenueChartProps) {
  const router = useRouter();

  // Find the latest month index that has recorded volume, or default to null
  const lastActiveIndex = (() => {
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i] > 0) return i;
    }
    return 1; // Default to Feb if available
  })();

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(lastActiveIndex);

  const handleBarClick = (monthName: string) => {
    router.push(`/dashboard/commitments?month=${monthName}&year=${selectedYear}`);
  };

  // Pure authentic data directly from database aggregations — zero mock sample volumes
  const activeData = monthlyData;

  const chartWidth = 680;
  const chartHeight = 220;
  const barWidth = 24;
  const gap = 28;

  // Compute clean scale ceiling from genuine data
  const maxInData = Math.max(...activeData, 0);
  const maxVal = maxInData > 50000 ? Math.ceil(maxInData / 25000) * 25000 : 50000;
  const yTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  const activeHover = hoveredIdx !== null ? hoveredIdx : null;
  const tooltipVal = activeHover !== null ? (activeData[activeHover] || 0) : 0;
  const tooltipX = activeHover !== null ? (65 + activeHover * (barWidth + gap) + barWidth / 2) : 0;
  const barHeight = maxVal > 0 ? (tooltipVal / maxVal) * chartHeight : 0;
  const tooltipY = Math.max(30, chartHeight - barHeight + 5);

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }} onMouseLeave={() => setHoveredIdx(lastActiveIndex)}>
      {/* Tooltip bubble */}
      {activeHover !== null && (
        <div
          style={{
            position: 'absolute',
            top: `${tooltipY}px`,
            left: `${tooltipX}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#090e0c',
            border: '1px solid #14241d',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            pointerEvents: 'none',
            zIndex: 10,
            textAlign: 'center',
            minWidth: '95px',
            lineHeight: 1.3
          }}
        >
          <div style={{ color: '#8fa89b', fontSize: '0.68rem', fontWeight: 500 }}>
            {months[activeHover]} {selectedYear}
          </div>
          <div style={{ color: '#ffffff', fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>
            £{tooltipVal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {/* Tooltip caret */}
          <div
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #090e0c'
            }}
          />
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 45}`}
        style={{ width: '100%', minWidth: '580px', height: 'auto', display: 'block' }}
      >
        {/* Horizontal Grid lines and Y labels */}
        {yTicks.map((val) => {
          const ratio = val / maxVal;
          const y = chartHeight * (1 - ratio) + 15;
          const label = val === 0 ? '£0' : `£${(val / 1000).toFixed(0)}K`;

          return (
            <g key={val}>
              <line
                x1="60"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#dcd7ca"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <text
                x="52"
                y={y + 4}
                fill="#57655c"
                fontSize="11"
                fontWeight="500"
                textAnchor="end"
                fontFamily="var(--font-family-body)"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Columns & Bars */}
        {activeData.map((val, idx) => {
          const hasData = val > 0;
          const rawHeight = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
          const bHeight = hasData ? Math.max(rawHeight, 4) : 3;
          const x = 65 + idx * (barWidth + gap);
          const y = chartHeight - bHeight + 15;
          const isHovered = activeHover === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onClick={() => handleBarClick(months[idx])}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area */}
              <rect
                x={x - gap / 4}
                y={15}
                width={barWidth + gap / 2}
                height={chartHeight}
                fill="transparent"
              />

              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={bHeight}
                fill={hasData ? (isHovered ? '#d97746' : '#0c4e43') : '#dcd7ca'}
                rx={hasData ? 6 : 2}
                ry={hasData ? 6 : 2}
                opacity={hasData ? (isHovered ? 1 : 0.92) : 0.45}
                style={{
                  transition: 'all 0.18s ease'
                }}
              />

              {/* Month label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 35}
                fill={isHovered ? '#0c4e43' : '#57655c'}
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                textAnchor="middle"
                fontFamily="var(--font-family-body)"
              >
                {months[idx]?.substring(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
