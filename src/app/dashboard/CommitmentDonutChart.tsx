'use client';

interface CommitmentDonutChartProps {
  total: number;
  active: number;
  pending: number;
  completed: number;
}

export default function CommitmentDonutChart({
  total = 69,
  active = 68,
  pending = 0,
  completed = 0,
}: CommitmentDonutChartProps) {
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentages
  const safeTotal = total > 0 ? total : 1;
  const activePercent = (active / safeTotal) * 100;
  const pendingPercent = (pending / safeTotal) * 100;
  const completedPercent = (completed / safeTotal) * 100;

  const activeDash = (activePercent / 100) * circumference;
  const pendingDash = (pendingPercent / 100) * circumference;
  const completedDash = (completedPercent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* SVG Donut Chart */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '10px auto' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Base empty ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />

          {/* Active Segment (Deep Forest Green) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2E5A44"
            strokeWidth={strokeWidth}
            strokeDasharray={`${activeDash} ${circumference - activeDash}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />

          {/* Pending Segment (Warm Amber, if any) */}
          {pending > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#D97706"
              strokeWidth={strokeWidth}
              strokeDasharray={`${pendingDash} ${circumference - pendingDash}`}
              strokeDashoffset={-activeDash}
              strokeLinecap="round"
            />
          )}

          {/* Completed Segment (Grey, if any) */}
          {completed > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth={strokeWidth}
              strokeDasharray={`${completedDash} ${circumference - completedDash}`}
              strokeDashoffset={-(activeDash + pendingDash)}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#111827',
            fontFamily: 'var(--font-family-title)',
            lineHeight: 1
          }}>
            {total}
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            fontWeight: 500,
            marginTop: '4px'
          }}>
            Total
          </span>
        </div>
      </div>

      {/* Legend below donut */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        marginTop: '16px',
        fontSize: '0.78rem',
        color: '#4B5563',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2E5A44' }} />
          <span>Active</span>
          <span style={{ color: '#6B7280' }}>{active} ({activePercent.toFixed(1)}%)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
          <span>Pending</span>
          <span style={{ color: '#6B7280' }}>{pending} ({pendingPercent.toFixed(0)}%)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
          <span>Completed</span>
          <span style={{ color: '#6B7280' }}>{completed} ({completedPercent.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}
