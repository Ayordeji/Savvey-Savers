'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../users/users.module.css';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  invitedBy?: string;
  displayId?: string;
  invitationId?: string;
}

export default function MemberReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading report...</div>}>
      <MemberReportContent />
    </Suspense>
  );
}

function MemberReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(''); // 'Active' or 'Inactive'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    
    // Status matching
    const isActiveStatus = statusFilter === 'Active';
    const isInactiveStatus = statusFilter === 'Inactive';
    const matchesStatus = !statusFilter || (isActiveStatus && u.isActive) || (isInactiveStatus && !u.isActive);
    
    if (!matchesStatus) return false;
    
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.displayId && u.displayId.toLowerCase().includes(q))
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const idA = (a.displayId || a.invitationId || a.id || '').toString();
    const idB = (b.displayId || b.invitationId || b.id || '').toString();
    return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
  const currentUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['INVITATION ID', 'NAME', 'EMAIL', 'PHONE NUMBER', 'ROLE', 'CREATED ON', 'IS ACTIVE', 'LAST LOGGED', 'INVITED BY'];
    const rows = filteredUsers.map(u => [
      `"${u.displayId || u.invitationId || u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone || 'N/A'}"`,
      `"${u.role === 'ADMIN' ? 'Admin' : 'Savers'}"`,
      `"${new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB')}"`,
      `"${u.isActive ? 'Yes' : 'No'}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB') : 'N/A'}"`,
      `"${u.invitedBy || 'Super. Admin'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `members_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading member report...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.searchBarContainer}>
        <div>
          <h2 className={styles.title} style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Members Report
          </h2>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className={styles.searchBarContainer} style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', minWidth: '200px' }}
          >
            <option value="">Choose Active/Inactive User</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className={styles.searchWrapper} style={{ minWidth: '250px' }}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary btn-sm"
          style={{ backgroundColor: '#1e293b', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, border: 'none' }}
        >
          <Download size={15} style={{ marginRight: '6px' }} />
          Export
        </button>
      </div>

      <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ minWidth: '120px' }}>INVITATION ID</th>
                <th style={{ minWidth: '180px' }}>NAME</th>
                <th style={{ minWidth: '200px' }}>EMAIL</th>
                <th style={{ minWidth: '130px' }}>PHONE NUMBER</th>
                <th style={{ minWidth: '100px' }}>ROLE</th>
                <th style={{ minWidth: '120px' }}>CREATED ON</th>
                <th style={{ minWidth: '90px' }}>IS ACTIVE</th>
                <th style={{ minWidth: '120px' }}>LAST LOGGED</th>
                <th style={{ minWidth: '140px' }}>INVITED BY</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((u) => (
                <tr key={u.id} className={styles.tableRow}>
                  <td className={styles.idCell} style={{ fontWeight: 600 }}>
                    {u.displayId || u.invitationId || u.id.slice(0,8)}
                  </td>
                  <td>
                    <div className={styles.userNameWrap}>
                      <span className={styles.userName}>{u.name}</span>
                    </div>
                  </td>
                  <td className={styles.emailCell}>{u.email}</td>
                  <td className={styles.phoneCell}>{u.phone || 'N/A'}</td>
                  <td>{u.role === 'ADMIN' ? 'Admin' : 'Savers'}</td>
                  <td className={styles.dateCell}>
                    {new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB')}
                  </td>
                  <td>{u.isActive ? 'Yes' : 'No'}</td>
                  <td className={styles.dateCell}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td>{u.invitedBy || 'Super. Admin'}</td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    No members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Details */}
        {sortedUsers.length > 0 && (
          <div className={styles.paginationSection} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)' }}>
            <div className={styles.pageButtons} style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className={styles.pageBtn}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePageBtn : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                  style={currentPage === i + 1 ? { backgroundColor: '#1e293b', color: '#fff', border: 'none' } : {}}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
            <div className={styles.pageInfo} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {currentUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedUsers.length)} of {sortedUsers.length} entries
            </div>
          </div>
        )}
      </div>
  );
}
