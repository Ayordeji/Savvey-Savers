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
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      color: 'white',
    }}>
      <div className="loading-spinner" style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(255, 255, 255, 0.1)',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>

      <p style={{
        color: '#e2e8f0',
        fontSize: '0.95rem',
        fontWeight: 600,
        letterSpacing: '0.05em'
      }}>
        Loading...
      </p>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
