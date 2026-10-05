'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface MarketingHeaderProps {
  onOpenLogin?: () => void;
  onOpenWaitlist?: () => void;
  activePath?: string;
}

export default function MarketingHeader({
  onOpenLogin,
  onOpenWaitlist,
  activePath = '/',
}: MarketingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about-us' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Terms and Conditions', href: '/terms-and-conditions' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#F4F1E8', // exact warm cream from old design
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0px 0px 10px -2px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 80px',
          height: '84px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        className="header-inner-container"
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          <img
            src="/logo_new-removebg-preview.png"
            alt="Savvey Savers"
            style={{
              height: '52px',
              width: 'auto',
              objectFit: 'contain',
              cursor: 'pointer',
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '32px',
          }}
          className="desktop-nav"
        >
          {navLinks.map((item) => {
            const isActive = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: '1rem',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-family-body)',
                  color: isActive ? '#0E4F45' : '#1A1A1A',
                  textDecoration: 'none',
                  position: 'relative',
                  padding: '6px 0',
                  transition: 'color 0.2s ease',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0E4F45';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#1A1A1A';
                }}
              >
                {item.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#0E4F45',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Header CTA Buttons matching old design (pill buttons) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {onOpenLogin ? (
            <button
              onClick={onOpenLogin}
              style={{
                padding: '10px 24px',
                borderRadius: '360px',
                border: '2px solid #1A1A1A',
                backgroundColor: 'transparent',
                color: '#1A1A1A',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A';
                e.currentTarget.style.color = '#FFFDFA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1A1A1A';
              }}
            >
              Login
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                padding: '10px 24px',
                borderRadius: '360px',
                border: '2px solid #1A1A1A',
                backgroundColor: 'transparent',
                color: '#1A1A1A',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A';
                e.currentTarget.style.color = '#FFFDFA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1A1A1A';
              }}
            >
              Login
            </Link>
          )}

          {onOpenWaitlist ? (
            <button
              onClick={onOpenWaitlist}
              style={{
                padding: '10px 24px',
                borderRadius: '360px',
                border: '2px solid #0E4F45',
                backgroundColor: '#0E4F45',
                color: '#FFFDFA',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0E4F45F2';
                e.currentTarget.style.borderColor = '#0E4F45F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0E4F45';
                e.currentTarget.style.borderColor = '#0E4F45';
              }}
            >
              Join Our Waiting List
            </button>
          ) : (
            <Link
              href="/#waitlist"
              style={{
                padding: '10px 24px',
                borderRadius: '360px',
                border: '2px solid #0E4F45',
                backgroundColor: '#0E4F45',
                color: '#FFFDFA',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0E4F45F2';
                e.currentTarget.style.borderColor = '#0E4F45F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0E4F45';
                e.currentTarget.style.borderColor = '#0E4F45';
              }}
            >
              Join Our Waiting List
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.15)',
              background: '#ffffff',
              color: '#1A1A1A',
              cursor: 'pointer',
            }}
            className="mobile-hamburger-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#F4F1E8',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            padding: '20px 32px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
          }}
          className="mobile-nav-drawer"
        >
          {navLinks.map((item) => {
            const isActive = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '1.05rem',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-family-body)',
                  color: isActive ? '#0E4F45' : '#1A1A1A',
                  textDecoration: 'none',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {onOpenLogin ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '360px',
                  border: '2px solid #1A1A1A',
                  backgroundColor: 'transparent',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Login
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '360px',
                  border: '2px solid #1A1A1A',
                  backgroundColor: 'transparent',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                Login
              </Link>
            )}

            {onOpenWaitlist ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWaitlist();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '360px',
                  border: '2px solid #0E4F45',
                  backgroundColor: '#0E4F45',
                  color: '#FFFDFA',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Join Our Waiting List
              </button>
            ) : (
              <Link
                href="/#waitlist"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '360px',
                  border: '2px solid #0E4F45',
                  backgroundColor: '#0E4F45',
                  color: '#FFFDFA',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                Join Our Waiting List
              </Link>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
        @media (max-width: 900px) {
          .header-inner-container {
            padding: 0 24px !important;
          }
        }
      `}</style>
    </header>
  );
}
