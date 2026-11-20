'use client';

import React, { useState, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Link2, Eye, Edit3 } from 'lucide-react';
import { renderFormattedHtml } from '@/lib/richText';

interface RichFormattingTextareaProps {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  helperText?: string;
  forEmail?: boolean;
}

export default function RichFormattingTextarea({
  label,
  required,
  value,
  onChange,
  placeholder = 'Type your message here...',
  rows = 5,
  minHeight = '140px',
  helperText,
  forEmail = false
}: RichFormattingTextareaProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (type: 'bold' | 'italic' | 'bullet' | 'number' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    let formatted = '';
    let newCursorPos = start;

    switch (type) {
      case 'bold':
        if (selected) {
          formatted = `**${selected}**`;
          newCursorPos = start + formatted.length;
        } else {
          formatted = '**bold text**';
          newCursorPos = start + 2;
        }
        break;

      case 'italic':
        if (selected) {
          formatted = `*${selected}*`;
          newCursorPos = start + formatted.length;
        } else {
          formatted = '*italic text*';
          newCursorPos = start + 1;
        }
        break;

      case 'bullet':
        if (selected) {
          // Add bullet to each line in selection
          formatted = selected
            .split('\n')
            .map(line => (line.trim().startsWith('- ') || line.trim().startsWith('• ') ? line : `- ${line}`))
            .join('\n');
          newCursorPos = start + formatted.length;
        } else {
          formatted = '\n- First point\n- Second point\n';
          newCursorPos = start + formatted.length;
        }
        break;

      case 'number':
        if (selected) {
          formatted = selected
            .split('\n')
            .map((line, idx) => (line.match(/^\d+\.\s/) ? line : `${idx + 1}. ${line}`))
            .join('\n');
          newCursorPos = start + formatted.length;
        } else {
          formatted = '\n1. First step\n2. Second step\n';
          newCursorPos = start + formatted.length;
        }
        break;

      case 'link':
        if (selected) {
          formatted = `[${selected}](https://example.com)`;
          newCursorPos = start + formatted.length - 1;
        } else {
          formatted = '[link title](https://example.com)';
          newCursorPos = start + 1;
        }
        break;
    }

    const updated = value.substring(0, start) + formatted + value.substring(end);
    onChange(updated);

    // Restore focus and cursor position after React update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyFormat('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyFormat('italic');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Header bar with Label and Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label && (
          <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', margin: 0 }}>
            {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
        )}
        <div style={{ display: 'inline-flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: activeTab === 'write' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'write' ? '#0E4F45' : '#6B7280',
              boxShadow: activeTab === 'write' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Edit3 size={12} />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: activeTab === 'preview' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'preview' ? '#0E4F45' : '#6B7280',
              boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={12} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div style={{ border: '1px solid #D1D5DB', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        {/* Formatting Toolbar (visible in write mode) */}
        {activeTab === 'write' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#FAF9F6',
              borderBottom: '1px solid #ECE8E2',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              title="Bold (Ctrl+B / Cmd+B)"
              style={{
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE8E2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Bold size={14} />
              <span>Bold</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat('italic')}
              title="Italic (Ctrl+I / Cmd+I)"
              style={{
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE8E2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Italic size={14} />
              <span>Italic</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#E5E7EB', margin: '0 4px' }} />

            <button
              type="button"
              onClick={() => applyFormat('bullet')}
              title="Bullet List (- item)"
              style={{
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE8E2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <List size={14} />
              <span>Bullets</span>
            </button>

            <button
              type="button"
              onClick={() => applyFormat('number')}
              title="Numbered List (1. item)"
              style={{
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE8E2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ListOrdered size={14} />
              <span>Numbered</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#E5E7EB', margin: '0 4px' }} />

            <button
              type="button"
              onClick={() => applyFormat('link')}
              title="Add Link [text](url)"
              style={{
                background: 'none',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ECE8E2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Link2 size={14} />
              <span>Link</span>
            </button>
          </div>
        )}

        {/* Textarea or Preview Body */}
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight,
              padding: '12px 14px',
              border: 'none',
              outline: 'none',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: '#111827',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        ) : (
          <div
            style={{
              padding: '16px',
              minHeight,
              backgroundColor: '#FAF9F6',
              fontSize: '0.88rem',
              color: '#1E293B',
              lineHeight: 1.6,
              overflowY: 'auto'
            }}
          >
            {value.trim() ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: renderFormattedHtml(value, { forEmail })
                }}
              />
            ) : (
              <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                No message entered yet. Switch back to Write to add text.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div style={{ fontSize: '0.74rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{helperText || 'Use toolbar or type **bold**, *italic*, - bullet points, and 1. numbered lists.'}</span>
        {activeTab === 'write' && (
          <span style={{ color: '#9CA3AF' }}>{value.length} characters</span>
        )}
      </div>
    </div>
  );
}
