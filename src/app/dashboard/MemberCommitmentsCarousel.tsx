'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Commitment {
  id: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
}

interface MemberCommitmentsCarouselProps {
  commitments: Commitment[];
}

export default function MemberCommitmentsCarousel({ commitments }: MemberCommitmentsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = commitments.length;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation if wrapped in Link
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  if (total === 0) {
    return (
      <div style={{
        backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', minHeight: '130px', color: '#ffffff'
      }} className="dashboard-interactive-card">
        <span style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 600 }}>Savings Count : 0</span>
        <p style={{ color: '#e2e8f0', marginTop: '12px' }}>No active commitments</p>
      </div>
    );
  }

  const current = commitments[currentIndex];

  return (
    <div style={{
      backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'row', 
      alignItems: 'center', justifyContent: 'space-between', minHeight: '130px', color: '#ffffff',
      cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease'
    }} className="dashboard-interactive-card">
      
      <div 
        onClick={handlePrev}
        style={{ padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={32} color="#ffffff" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center', flex: 1 }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
          Savings Count : {currentIndex + 1} of {total}
        </h3>
        
        <div style={{ fontSize: '1rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <div><strong style={{ color: '#ffffff' }}>Savings Amount:</strong> £{current.amount.toFixed(2)}</div>
          <div><strong style={{ color: '#ffffff' }}>Savings Goal:</strong> {current.goal}</div>
          <div><strong style={{ color: '#ffffff' }}>Collection Month:</strong> {current.collectionMonth}</div>
        </div>
      </div>

      <div 
        onClick={handleNext}
        style={{ padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronRight size={32} color="#ffffff" />
      </div>

    </div>
  );
}
