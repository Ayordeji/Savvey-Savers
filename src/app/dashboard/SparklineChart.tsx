'use client';

export default function SparklineChart() {
  return (
    <div style={{ width: '100%', height: '56px', marginTop: '12px', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 300 60"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="goldSparklineFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C59A52" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#C59A52" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#C59A52" stopOpacity="0" />
          </linearGradient>
          <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#DFB268" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Gradient fill area */}
        <path
          d="M 0 52 
             C 40 50, 70 45, 110 40 
             C 140 37, 170 32, 200 24 
             C 230 16, 260 20, 290 8 
             L 300 7 L 300 60 L 0 60 Z"
          fill="url(#goldSparklineFill)"
        />

        {/* Crisp Golden Sparkline */}
        <path
          d="M 0 52 
             C 40 50, 70 45, 110 40 
             C 140 37, 170 32, 200 24 
             C 230 16, 260 20, 290 8 
             L 300 7"
          fill="none"
          stroke="#DFB268"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#goldGlow)"
        />
      </svg>
    </div>
  );
}
