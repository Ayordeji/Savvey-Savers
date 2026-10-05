'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className="back-to-top-button"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          backgroundColor: '#0E4F45',
          color: '#FFFDFA',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 6px 20px rgba(14, 79, 69, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#083c33';
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(14, 79, 69, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0E4F45';
          e.currentTarget.style.transform = visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 79, 69, 0.4)';
        }}
      >
        <ArrowUp size={22} strokeWidth={2.4} />
      </button>

      <style jsx>{`
        @media (max-width: 768px) {
          .back-to-top-button {
            bottom: 20px !important;
            right: 20px !important;
            width: 42px !important;
            height: 42px !important;
          }
        }
      `}</style>
    </>
  );
}
