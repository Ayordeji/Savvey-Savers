'use client';

import { useState } from 'react';

interface MonthlyRevenueChartProps {
  monthlyData: number[];
  months: string[];
}

export default function MonthlyRevenueChart({ monthlyData, months }: MonthlyRevenueChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartWidth = 720;
  const chartHeight = 240;
  const barWidth = 40;
  const gap = 16;
  const maxVal = Math.max(...monthlyData, 600); // match grid max from screenshot

  return (
    <div style={{ position: 'relative' }}>
      {/* Premium Tooltip popup matching screenshot */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${70 + hoveredIdx * (barWidth + gap) + barWidth / 2}px`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          color: '#111827',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
          border: '1px solid #f3f4f6',
          pointerEvents: 'none',
          zIndex: 10,
          textAlign: 'left',
          minWidth: '110px'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#111827', fontWeight: 600, marginBottom: '4px' }}>
            {months[hoveredIdx].substring(0, 3)}
          </div>
          <div style={{ color: '#064e3b', fontSize: '0.8rem', fontWeight: 500 }}>
            revenue : £{monthlyData[hoveredIdx].toFixed(2)}
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
        style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}
      >
        {/* Grid lines and Y labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight * (1 - ratio) + 10;
          const value = Math.round(maxVal * ratio);
          return (
            <g key={i}>
              <line
                x1="60"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x="50"
                y={y + 4}
                fill="#9ca3af"
                fontSize="11"
                textAnchor="end"
                fontFamily="var(--font-family-body)"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Solid Y-axis line */}
        <line
          x1="60"
          y1="10"
          x2="60"
          y2={chartHeight + 10}
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Solid X-axis line */}
        <line
          x1="60"
          y1={chartHeight + 10}
          x2={chartWidth}
          y2={chartHeight + 10}
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {/* Columns and Bars */}
        {monthlyData.map((val, idx) => {
          const barHeight = val > 0 ? (val / maxVal) * chartHeight : 0; 
          const x = 70 + idx * (barWidth + gap);
          const y = chartHeight - barHeight + 10;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hover highlight background rectangle */}
              {isHovered && (
                <rect
                  x={x - gap / 2}
                  y={10}
                  width={barWidth + gap}
                  height={chartHeight}
                  fill="#e5e7eb"
                  opacity="0.8"
                  rx="2"
                />
              )}

              {/* Tooltip trigger area */}
              <rect
                x={x - gap / 2}
                y={10}
                width={barWidth + gap}
                height={chartHeight}
                fill="transparent"
              />

              {/* Bar (only rendered if val > 0) */}
              {val > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#064e3b" /* Dark forest green emerald */
                  rx="1"
                  style={{
                    transition: 'all 0.15s ease-in-out',
                    transform: isHovered ? 'scaleX(1.02)' : undefined,
                    transformOrigin: 'bottom'
                  }}
                />
              )}

              {/* Month label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 30}
                fill={isHovered ? '#111827' : '#9ca3af'}
                fontSize="11"
                fontWeight={isHovered ? '600' : '400'}
                textAnchor="middle"
                fontFamily="var(--font-family-body)"
              >
                {months[idx].substring(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
