'use client';

export default function GlobalLoading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      background: 'radial-gradient(ellipse at bottom, #111827 0%, #07090e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      color: 'white',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <img
          src="/logo_new-removebg-preview.png"
          alt="Savvey Savers"
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            padding: '4px',
            flexShrink: 0,
            animation: 'pulse 1.8s infinite ease-in-out'
          }}
        />
        <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'white', letterSpacing: '-0.02em' }}>
          Savvey Savers
        </span>
      </div>

      <div className="loading-spinner" style={{
        width: '32px',
        height: '32px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid var(--primary, #3b82f6)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>

      <p style={{
        color: '#9ca3af',
        fontSize: '0.875rem',
        fontWeight: 500,
        letterSpacing: '0.05em'
      }}>
        Loading platform...
      </p>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
