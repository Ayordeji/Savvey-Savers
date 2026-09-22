'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Download,
  Search,
  Users,
  UserCheck,
  Clock,
  Shield,
  Filter,
  RotateCcw,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  ArrowUpDown
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PaginationControls from '../../PaginationControls';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  invitedBy?: string;
  displayId?: string;
  invitationId?: string;
}

export default function MemberReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: '#6B7280' }}>Loading report...</div>}>
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
  const [roleFilter, setRoleFilter] = useState(''); // 'ADMIN' or 'MEMBER'

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'displayId', direction: 'desc' });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  // KPI Computations
  const totalMembers = users.length;
  const activeMembers = users.filter(u => u.isActive).length;
  const pendingMembers = users.filter(u => !u.isActive).length;
  const adminMembers = users.filter(u => u.role === 'ADMIN' || u.isSuperAdmin).length;

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();

      // Status matching
      if (statusFilter === 'Active' && !u.isActive) return false;
      if (statusFilter === 'Inactive' && u.isActive) return false;

      // Role matching
      if (roleFilter && u.role !== roleFilter) return false;

      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q)) ||
        (u.displayId && u.displayId.toLowerCase().includes(q)) ||
        (u.invitationId && u.invitationId.toLowerCase().includes(q))
      );
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;

      let aVal: any = a[key as keyof typeof a];
      let bVal: any = b[key as keyof typeof b];

      if (key === 'displayId') {
        aVal = a.displayId || a.invitationId || a.id || '';
        bVal = b.displayId || b.invitationId || b.id || '';
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
          : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));
  const currentUsers = useMemo(() => {
    return sortedUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedUsers, currentPage, itemsPerPage]);

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['MEMBER ID', 'NAME', 'EMAIL', 'PHONE NUMBER', 'ROLE', 'STATUS', 'CREATED ON', 'LAST LOGGED', 'INVITED BY'];
    const rows = filteredUsers.map(u => [
      `"${u.displayId || u.invitationId || u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone || 'N/A'}"`,
      `"${u.role === 'ADMIN' ? 'Admin' : 'Member'}"`,
      `"${u.isActive ? 'Active' : 'Pending / Inactive'}"`,
      `"${new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB')}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-GB') : 'Never'}"`,
      `"${u.invitedBy || 'System / Platform'}"`
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
      <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
        <p>Loading members report...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Members Report
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Audit and review member directory, account statuses, and platform activity.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#374151',
            border: '1px solid #ECE8E2',
            borderRadius: '10px',
            padding: '9px 16px',
            fontWeight: 600,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Download size={15} />
          <span>Export CSV</span>
          <ChevronDown size={14} style={{ opacity: 0.7 }} />
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Total Members */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Members</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{totalMembers}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Registered directory</span>
        </div>

        {/* Active Members */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Active Members</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#0c4e43', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{activeMembers}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Active platform accounts</span>
        </div>

        {/* Pending / Inactive */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Pending / Inactive</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{pendingMembers}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Awaiting activation or suspended</span>
        </div>

        {/* Administrators */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Administrators</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{adminMembers}</div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Admin privilege accounts</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #ECE8E2',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
            <Filter size={15} />
            Filters:
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FAF9F6',
            border: '1px solid #ECE8E2',
            borderRadius: '10px',
            padding: '7px 12px',
            minWidth: '240px',
            flex: '1 1 200px',
            maxWidth: '360px'
          }}>
            <Search size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, email, ID, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.82rem',
                color: '#111827',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '7px 12px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive / Pending</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '7px 12px',
              fontSize: '0.82rem',
              borderRadius: '8px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '130px'
            }}
          >
            <option value="">All Roles</option>
            <option value="MEMBER">Member (Savers)</option>
            <option value="ADMIN">Admin</option>
          </select>

          {(searchQuery || statusFilter || roleFilter) && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.82rem',
                color: '#6B7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '6px 10px'
              }}
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', overflow: 'hidden' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
              <th
                onClick={() => requestSort('displayId')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>MEMBER ID</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th
                onClick={() => requestSort('name')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>MEMBER</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th
                onClick={() => requestSort('email')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>EMAIL</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PHONE
              </th>
              <th
                onClick={() => requestSort('role')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>ROLE</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th
                onClick={() => requestSort('isActive')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>STATUS</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th
                onClick={() => requestSort('createdAt')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>JOINED</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th
                onClick={() => requestSort('lastLoginAt')}
                style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>LAST ACTIVE</span>
                  <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                </div>
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                  No members match your search criteria.
                </td>
              </tr>
            ) : (
              currentUsers.map((u) => {
                const initials = u.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
                const displayId = u.displayId || u.invitationId || u.id;
                const isAdmin = u.role === 'ADMIN' || u.isSuperAdmin;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #ECE8E2', transition: 'background-color 0.15s ease' }}>
                    {/* Member ID Pill */}
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        backgroundColor: '#EAF5EE',
                        color: '#0c4e43',
                        display: 'inline-block'
                      }}>
                        {displayId}
                      </span>
                    </td>

                    {/* Member Name + Avatar */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#0c4e43',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                            {u.name}
                          </div>
                          {u.invitedBy ? (
                            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                              Invited by {u.invitedBy}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#374151' }}>
                      {u.email}
                    </td>

                    {/* Phone */}
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#6B7280' }}>
                      {u.phone || '—'}
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: isAdmin ? '#EDE9FE' : '#EAF5EE',
                        color: isAdmin ? '#6D28D9' : '#0c4e43'
                      }}>
                        {isAdmin ? 'Admin' : 'Saver'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: u.isActive ? '#EAF5EE' : '#FEF3C7',
                        color: u.isActive ? '#2E7D32' : '#B45309'
                      }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Last Active */}
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Never'}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/dashboard/users?search=${encodeURIComponent(u.name)}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #ECE8E2',
                          backgroundColor: '#FFFFFF',
                          color: '#0c4e43',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <span>View User</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedUsers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
        itemLabel="member"
      />
    </div>
  );
}
