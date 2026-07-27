'use client';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemLabel?: string;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel = 'record'
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
        if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
          acc.push('...');
        }
        acc.push(p);
        return acc;
      }, []);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '20px',
      padding: '12px 16px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      {/* Left: Item count & Per page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}{totalItems !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {[10, 20, 30, 40, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Navigation */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === 1 ? '#f8fafc' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f172a',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.6 : 1,
            transition: 'all 0.15s'
          }}
        >
          ← Prev
        </button>

        {getPageNumbers().map((item, idx) =>
          item === '...' ? (
            <span key={`ellipsis-${idx}`} style={{ padding: '6px 4px', color: '#94a3b8', fontSize: '0.85rem' }}>…</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item as number)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.825rem',
                fontWeight: 700,
                border: item === currentPage ? '1px solid #2e3a4e' : '1px solid #cbd5e1',
                backgroundColor: item === currentPage ? '#2e3a4e' : '#ffffff',
                color: item === currentPage ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 600,
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage === totalPages ? '#f8fafc' : '#ffffff',
            color: currentPage === totalPages ? '#94a3b8' : '#0f172a',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.6 : 1,
            transition: 'all 0.15s'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
