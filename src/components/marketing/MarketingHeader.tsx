'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, UserCheck } from 'lucide-react';

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
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
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
            alt="Savvey Savers Collective"
            style={{
              height: '46px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '28px',
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
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-family-body)',
                  color: isActive ? 'var(--primary)' : 'var(--text-main)',
                  textDecoration: 'none',
                  position: 'relative',
                  padding: '8px 0',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-main)';
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
                      backgroundColor: 'var(--primary)',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
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
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              Login
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              Login
            </Link>
          )}

          {onOpenWaitlist ? (
            <button
              onClick={onOpenWaitlist}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--secondary)',
                color: '#ffffff',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px var(--secondary-glow)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Join Waiting List</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <Link
              href="/#waitlist"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--secondary)',
                color: '#ffffff',
                fontFamily: 'var(--font-family-title)',
                fontWeight: 700,
                fontSize: '0.875rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px var(--secondary-glow)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Join Waiting List</span>
              <ArrowRight size={15} />
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
              border: '1px solid var(--border-color)',
              background: '#ffffff',
              color: 'var(--text-main)',
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
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-color)',
            padding: '20px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-md)',
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
                  fontSize: '1rem',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-family-body)',
                  color: isActive ? 'var(--primary)' : 'var(--text-main)',
                  textDecoration: 'none',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {onOpenLogin ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Member Login
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-family-title)',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                Member Login
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
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--secondary)',
                  color: '#ffffff',
                  fontWeight: 700,
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
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--secondary)',
                  color: '#ffffff',
                  fontWeight: 700,
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
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
