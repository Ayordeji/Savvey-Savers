'use client';

import { useState, useEffect, Fragment, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Plus, Eye, Edit, Trash2, X, MoreVertical, BellRing, Check, PoundSterling, Calendar, ChevronDown, ChevronUp, ExternalLink, Banknote, DollarSign, ReceiptText, FileText } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';
import styles from './commitments.module.css';

interface Commitment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  goal: string;
  collectionMonth: string;
  collectionYear: number;
  endDate: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NOT_YET_STARTED';
  createdAt: string;
}

interface Payment {
  id: string;
  commitmentId: string;
  amount: number;
  month: string;
  year: number;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  receiptUrl?: string | null;
}

interface User {
  id: string;
  name: string;
  role: string;
  invitationId?: string;
}

export default function SavingsCommitmentsPage() {
  return (
    <Suspense fallback={<div>Loading commitments...</div>}>
      <CommitmentsContent />
    </Suspense>
  );
}

function CommitmentsContent() {
  const searchParams = useSearchParams();
  const dialog = useDialog();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: 'ADMIN' | 'MEMBER' } | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});
  const [users, setUsers] = useState<User[]>([]);

  // Selection & Bulk Delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Settings configs
  const [goals, setGoals] = useState<{ name: string; enabled: boolean }[]>([]);
  const [amounts, setAmounts] = useState<{ amount: number; enabled: boolean }[]>([]);

  // UI expansion states
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<'NONE' | 'ADD' | 'EDIT' | 'REMINDER' | 'PAST_PAYMENT' | 'VIEW_COMMITMENT'>('NONE');
  const [selectedCmt, setSelectedCmt] = useState<Commitment | null>(null);
  const [viewCmtPayments, setViewCmtPayments] = useState<Payment[]>([]);
  const [viewCmtLoading, setViewCmtLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (!openDropdownId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.actionsDropdown}`)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openDropdownId]);

  // Add/Edit Commitment Fields
  const [formSaverId, setFormSaverId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formMonth, setFormMonth] = useState('January');
  const [formYear, setFormYear] = useState('2026');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NOT_YET_STARTED'>('ACTIVE');

  // Reminder fields — now supports bulk (multiple commitments)
  const [reminderCmtIds, setReminderCmtIds] = useState<string[]>([]);

  // Past payment fields
  const [pastPayMonth, setPastPayMonth] = useState('January');
  const [pastPayCollectionMonth, setPastPayCollectionMonth] = useState('January');
  const [pastPaySendNotification, setPastPaySendNotification] = useState<'yes' | 'no'>('no');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchInitialData = async () => {
    try {
      // 1. Always fetch session first — this is the source of truth for role
      const sessRes = await fetch('/api/auth/session');
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        if (sessData.loggedIn && sessData.user) {
          setCurrentUser(sessData.user);
        } else {
          setCurrentUser({ id: 'member', role: 'MEMBER' });
        }
      } else {
        setCurrentUser({ id: 'member', role: 'MEMBER' });
      }

      // 2. Fetch users list + commitments (admin-only endpoint)
      const meRes = await fetch('/api/admin/users');
      if (meRes.ok) {
        const uList = await meRes.json();
        setUsers(uList.filter((u: any) => u.role === 'MEMBER'));
      }

      // 3. Always fetch commitments (accessible by all logged-in users)
      const cmtRes = await fetch('/api/admin/commitments');
      if (cmtRes.ok) {
        const cmtData = await cmtRes.json();
        setCommitments(cmtData);
      }

      // 4. Fetch settings
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setGoals(sData.savingGoals?.filter((g: any) => g.enabled) || []);
        setAmounts(sData.commitmentAmounts?.filter((a: any) => a.enabled) || []);
      }

      // 5. Pre-load payments for all commitments so the dropdown shows correct state immediately
      if (cmtRes.ok) {
        const freshCommitmentsRes = await fetch('/api/admin/commitments');
        const freshCommitments = freshCommitmentsRes.ok ? await freshCommitmentsRes.json() : [];
        const allPaymentsRes = await Promise.allSettled(
          freshCommitments.map((cmt: any) =>
            fetch(`/api/admin/payments?commitmentId=${cmt.id}`)
              .then(r => r.ok ? r.json() : [])
              .then(payments => ({ id: cmt.id, payments }))
          )
        );
        const newPaymentsMap: Record<string, Payment[]> = {};
        for (const result of allPaymentsRes) {
          if (result.status === 'fulfilled') {
            newPaymentsMap[result.value.id] = result.value.payments;
          }
        }
        setPaymentsMap(newPaymentsMap);
      }
    } catch (err) {
      console.error('Error fetching commitments page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (cmtId: string) => {
    try {
      const res = await fetch(`/api/admin/payments?commitmentId=${cmtId}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentsMap((prev) => ({ ...prev, [cmtId]: data }));
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);


  const handleOpenAddModal = () => {
    setErrorMsg('');
    setFormSaverId(users[0]?.id || '');
    setFormAmount(amounts[0]?.amount.toString() || '100');
    setFormGoal(goals[0]?.name || 'Savings');
    setFormMonth('January');
    setFormYear('2026');
    setActiveModal('ADD');
  };

  const handleOpenReminderModal = () => {
    setErrorMsg('');
    // Pre-populate from selected IDs in table
    setReminderCmtIds(selectedIds.length > 0 ? [...selectedIds] : []);
    setActiveModal('REMINDER');
  };

  const handleOpenViewCommitmentModal = async (cmt: Commitment) => {
    setSelectedCmt(cmt);
    setViewCmtPayments([]);
    setViewCmtLoading(true);
    setActiveModal('VIEW_COMMITMENT');
    try {
      const res = await fetch(`/api/admin/payments?commitmentId=${cmt.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewCmtPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments for view:', err);
    } finally {
      setViewCmtLoading(false);
    }
  };

  const handleOpenPastPaymentModal = (cmt: Commitment) => {
    setErrorMsg('');
    setSelectedCmt(cmt);
    setPastPayMonth('January');
    setPastPayCollectionMonth(cmt.collectionMonth || 'January');
    setPastPaySendNotification('no');
    setReceiptFile(null);
    setActiveModal('PAST_PAYMENT');
    setOpenDropdownId(null);
  };

  const handleOpenEditModal = (cmt: Commitment) => {
    setErrorMsg('');
    setSelectedCmt(cmt);
    setFormAmount(cmt.amount.toString());
    setFormGoal(cmt.goal);
    setFormMonth(cmt.collectionMonth);
    setFormYear(cmt.collectionYear.toString());
    setFormStatus(cmt.status);
    setActiveModal('EDIT');
    setOpenDropdownId(null);
  };

  const handleAddSubmit = async (requestCollection: boolean) => {
    setErrorMsg('');
    if (currentUser?.role === 'ADMIN' && !formSaverId) {
      setErrorMsg('Please select a member.');
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch('/api/admin/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser?.role === 'ADMIN' ? formSaverId : undefined,
          amount: formAmount,
          goal: formGoal,
          collectionMonth: formMonth,
          collectionYear: formYear,
          requestCollection
        }),
      });

      if (res.ok) {
        // Refresh commitments
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to create commitment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedCmt) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/commitments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCmt.id,
          amount: formAmount,
          goal: formGoal,
          collectionMonth: formMonth,
          collectionYear: formYear,
          status: formStatus
        })
      });

      if (res.ok) {
        // Refresh
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update commitment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (reminderCmtIds.length === 0) {
      setErrorMsg('Please select at least one savings commitment to send a reminder for.');
      return;
    }

    setFormSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const cmtId of reminderCmtIds) {
        const cmt = commitments.find((c) => c.id === cmtId);
        if (!cmt) continue;
        const res = await fetch('/api/admin/commitments/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SEND_REMINDER',
            memberId: cmt.memberId,
            commitmentId: cmtId
          })
        });
        if (res.ok) successCount++;
        else failCount++;
      }

      if (failCount === 0) {
        await dialog.alert('Reminders Dispatched', `Successfully sent ${successCount} payment reminder${successCount > 1 ? 's' : ''}!`);
      } else {
        await dialog.alert('Partial Success', `Sent ${successCount} reminders successfully. ${failCount} failed.`);
      }
      setActiveModal('NONE');
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePastPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedCmt) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAST_PAYMENT',
          commitmentId: selectedCmt.id,
          month: pastPayMonth,
          year: selectedCmt.collectionYear,
          amount: selectedCmt.amount,
          collectionMonth: pastPayCollectionMonth,
          sendNotification: pastPaySendNotification === 'yes'
        })
      });

      if (res.ok) {
        fetchPayments(selectedCmt.id);
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to record payment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string | undefined, commitmentId: string) => {
    if (!(await dialog.confirm('Confirm Payment', 'Confirm receipt of this contribution payment? This triggers an email receipt.', 'Proceed', 'Cancel'))) return;
    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM_PAYMENT',
          paymentId: paymentId || undefined,
          commitmentId
        })
      });

      if (res.ok) {
        // Refresh commitments
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
        await fetchPayments(commitmentId);
        await dialog.alert('Success', 'Payment confirmed successfully. The commitment now shows as Payment Done.');
      } else {
        const data = await res.json();
        await dialog.alert('Error', data.error || 'Failed to confirm payment.');
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
      await dialog.alert('Error', 'A network error occurred while confirming payment.');
    }
  };

  const handleReleaseHarvest = async (cmtId: string) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Release Harvest Payout', 'Are you sure you want to release the harvest payout? This will mark the rotating cycle commitment as Completed and notify the member.'))) return;

    try {
      const res = await fetch('/api/admin/commitments/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RELEASE_HARVEST',
          commitmentId: cmtId
        })
      });

      if (res.ok) {
        // Refresh commitments
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
      }
    } catch (err) {
      console.error('Error releasing harvest:', err);
    }
  };

  const handleDeleteCommitment = async (cmtId: string) => {
    setOpenDropdownId(null);
    if (!(await dialog.confirm('Delete Savings Commitment', 'Are you sure you want to delete this savings commitment? The record will be safely archived under Deleted Records.'))) return;

    try {
      const res = await fetch(`/api/admin/commitments?id=${cmtId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Refresh
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
      } else {
        const data = await res.json();
        await dialog.alert('Delete Failed', data.error || 'Failed to delete commitment.');
      }
    } catch (err) {
      console.error('Error deleting commitment:', err);
      await dialog.alert('Error', 'A network error occurred while deleting commitment.');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCommitments.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectCommitment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = await dialog.confirm(
      'Delete Selected Commitments',
      `Are you sure you want to delete ${selectedIds.length} selected savings commitments? They will be safely archived under Deleted Records.`
    );
    if (!confirmDelete) return;

    setIsBulkDeleting(true);
    try {
      const res = await fetch(`/api/admin/commitments?ids=${selectedIds.join(',')}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedIds([]);
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
      } else {
        const data = await res.json();
        await dialog.alert('Bulk Delete Failed', data.error || 'Failed to delete commitments.');
      }
    } catch (err) {
      await dialog.alert('Error', 'A network error occurred while deleting commitments.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  useEffect(() => {
    const m = searchParams.get('month');
    const y = searchParams.get('year');
    const s = searchParams.get('status');
    if (m) setMonthFilter(m);
    if (y) setYearFilter(y);
    if (s) setStatusFilter(s);
  }, [searchParams]);

  const currentYearNum = new Date().getFullYear();

  const toggleDropdown = (cmtId: string) => {
    const isOpening = openDropdownId !== cmtId;
    setOpenDropdownId(isOpening ? cmtId : null);
    if (isOpening && !paymentsMap[cmtId]) {
      fetchPayments(cmtId);
    }
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'id', direction: 'desc' });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredCommitments = commitments.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      c.memberName.toLowerCase().includes(q) ||
      c.goal.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    const matchesYear = !yearFilter || c.collectionYear.toString() === yearFilter;
    const matchesMonth = !monthFilter || c.collectionMonth === monthFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;

    return matchesSearch && matchesYear && matchesMonth && matchesStatus;
  });

  const sortedCommitments = [...filteredCommitments].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'id') {
      aVal = a.id || '';
      bVal = b.id || '';
    }
    
    if (key === 'memberName') {
      aVal = (a.memberName && a.memberName !== 'Unknown Member')
        ? a.memberName
        : (users.find(u => u.id === a.memberId || u.invitationId === a.memberId || u.name?.toLowerCase() === a.memberName?.toLowerCase())?.name || 'Member');
      bVal = (b.memberName && b.memberName !== 'Unknown Member')
        ? b.memberName
        : (users.find(u => u.id === b.memberId || u.invitationId === b.memberId || u.name?.toLowerCase() === b.memberName?.toLowerCase())?.name || 'Member');
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

  const totalPages = Math.max(1, Math.ceil(sortedCommitments.length / itemsPerPage));
  const paginatedCommitments = sortedCommitments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getActiveCommitmentsForMember = (memberId: string) => {
    return commitments.filter((c) => c.memberId === memberId && (c.status === 'ACTIVE' || c.status === 'PENDING'));
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.filterContainer}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Savings Commitments
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {selectedIds.length > 0 && currentUser?.role === 'ADMIN' && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="btn btn-danger btn-sm"
              style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={15} />
              <span>{isBulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}</span>
            </button>
          )}
          {selectedIds.length > 0 && currentUser?.role === 'ADMIN' && (
            <button
              onClick={handleOpenReminderModal}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BellRing size={15} />
              <span>Send Reminders ({selectedIds.length})</span>
            </button>
          )}
          {currentUser?.role === 'ADMIN' && selectedIds.length === 0 && (
            <button onClick={handleOpenReminderModal} className="btn btn-secondary btn-sm">
              <BellRing size={16} />
              <span>Send Reminder</span>
            </button>
          )}
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>New Savings Commitment</span>
          </button>
        </div>
      </div>

      {/* Filter bar with individual filter criteria dropdowns */}
      <div className={styles.filterContainer} style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className={styles.filtersLeft} style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Record ID, member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="form-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }}
          >
            <option value="">All Months</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="form-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }}
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
          </select>
        </div>

        {selectedIds.length > 0 && currentUser?.role === 'ADMIN' && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedIds.length} selected</span>
            <span>— use bulk actions above</span>
          </div>
        )}
      </div>

      {/* Commitments Table */}
      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Commitments...</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                {currentUser?.role === 'ADMIN' && (
                  <th style={{ width: '36px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredCommitments.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#2e3a4e', cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th style={{ width: '40px' }}></th>
                <th 
                  onClick={() => requestSort('id')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Record Id</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('memberName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Member Name</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'memberName' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Savings Amount</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'amount' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('collectionMonth')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Collection Month</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'collectionMonth' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th onClick={() => requestSort('collectionYear')} style={{ cursor: 'pointer', userSelect: 'none' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span>Collection Year</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
        {sortConfig?.key === 'collectionYear' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
      </span>
    </div>
  </th>
                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Status</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇕'}
                    </span>
                  </div>
                </th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCommitments.length === 0 ? (
                <tr>
                  <td colSpan={currentUser?.role === 'ADMIN' ? 9 : 8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No savings commitments found.
                  </td>
                </tr>
              ) : (
                paginatedCommitments.map((c, idx) => {
                  const isBottomRow = idx >= 2 && paginatedCommitments.length >= 4 && idx >= paginatedCommitments.length - 2;
                  const displayMemberName = (c.memberName && c.memberName !== 'Unknown Member')
                    ? c.memberName
                    : (users.find(u => u.id === c.memberId || u.invitationId === c.memberId || u.name?.toLowerCase() === c.memberName?.toLowerCase())?.name || 'Member');
                  
                  const formatStatusText = (st: string) => {
                    if (st === 'NOT_YET_STARTED') return 'Pending';
                    if (st === 'ACTIVE') return 'Active';
                    if (st === 'COMPLETED') return 'Completed';
                    if (st === 'PENDING') return 'Pending';
                    if (st === 'CANCELLED') return 'Cancelled';
                    return st;
                  };

                  return (
                    <Fragment key={c.id}>
                      <tr style={{ cursor: 'pointer' }}>
                        {currentUser?.role === 'ADMIN' && (
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(c.id)}
                              onChange={(e) => handleSelectCommitment(c.id, e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: '#2e3a4e', cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        <td></td>
                        <td
                          onClick={() => handleOpenViewCommitmentModal(c)}
                          style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                          title="Click to view commitment details"
                        >
                          {c.id}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/users?search=${encodeURIComponent(displayMemberName)}`);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left', fontSize: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.2)', textUnderlineOffset: '3px' }}
                            title={`View ${displayMemberName} in Manage Users`}
                          >
                            {displayMemberName}
                          </button>
                        </td>
                        <td>£{Number(c.amount).toFixed(2)}</td>
                        <td>{c.collectionMonth} {c.collectionYear}</td>
                        <td>{c.collectionYear}</td>
                        <td>
                          <span className={`status-pill ${c.status.toLowerCase().replace(/_/g, '-')}`}>
                            {formatStatusText(c.status)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', position: 'relative' }}>
                          <div className={styles.actionsDropdown}>
                            <button onClick={() => toggleDropdown(c.id)} className={styles.dropdownTrigger}>
                              <MoreVertical size={16} />
                            </button>
                            {openDropdownId === c.id && (
                              <div className={`${styles.dropdownMenu} ${isBottomRow ? styles.dropdownMenuUp : ''}`}>
                                <button onClick={() => handleOpenViewCommitmentModal(c)} className={styles.dropdownItem}>
                                  <Eye size={14} />
                                  <span>View</span>
                                </button>
                                {currentUser?.role === 'ADMIN' && (
                                  <>
                                    <button onClick={() => handleOpenEditModal(c)} className={styles.dropdownItem}>
                                      <Edit size={14} />
                                      <span>Edit</span>
                                    </button>
                                    
                                    {paymentsMap[c.id] === undefined ? (
                                      <button disabled className={styles.dropdownItem} style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                                        <ReceiptText size={14} />
                                        <span>Loading...</span>
                                      </button>
                                    ) : (
                                      // If there's a pending payment OR no payments exist (freshly created fallback)
                                      paymentsMap[c.id].some(p => p.status === 'PENDING') || paymentsMap[c.id].length === 0 ? (
                                        <button onClick={() => {
                                          const pending = paymentsMap[c.id]?.find(p => p.status === 'PENDING');
                                          handleConfirmPayment(pending?.id, c.id);
                                          setOpenDropdownId(null);
                                        }} className={styles.dropdownItem}>
                                          <ReceiptText size={14} />
                                          <span>Confirm Payment Receipt</span>
                                        </button>
                                      ) : (
                                        <button disabled className={styles.dropdownItem} style={{ opacity: 1, cursor: 'not-allowed', color: '#16a34a' }}>
                                          <ReceiptText size={14} color="#16a34a" />
                                          <span>Payment Done</span>
                                        </button>
                                      )
                                    )}

                                    {c.status !== 'CANCELLED' && (
                                      <button onClick={() => handleOpenPastPaymentModal(c)} className={styles.dropdownItem}>
                                        <FileText size={14} />
                                        <span>Payment For Past Month</span>
                                      </button>
                                    )}

                                    {c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && (
                                      <button onClick={() => handleReleaseHarvest(c.id)} className={styles.dropdownItem}>
                                        <FileText size={14} />
                                        <span>Release Harvest</span>
                                      </button>
                                    )}

                                    <button onClick={() => handleDeleteCommitment(c.id)} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                                      <X size={14} color="#dc2626" />
                                      <span style={{ color: '#dc2626' }}>Cancel</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedCommitments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
        itemLabel="savings commitment"
      />

      {/* --- ADD COMMITMENT MODAL --- */}
      {activeModal === 'ADD' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              New Savings Commitment
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Create a rotating savings cycle agreement with targets and collection dates.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentUser?.role === 'ADMIN' ? (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Savers (Registered Member)</label>
                  <select value={formSaverId} onChange={(e) => setFormSaverId(e.target.value)} className="form-select">
                    <option value="">Select a member...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Saver</label>
                  <input type="text" disabled value="Your Profile" className="form-input" style={{ opacity: 0.7 }} />
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Commitment Amount (£)</label>
                <select value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="form-select">
                  {amounts.map((a) => (
                    <option key={a.amount} value={a.amount}>£{a.amount}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Commitment Goal</label>
                <select value={formGoal} onChange={(e) => setFormGoal(e.target.value)} className="form-select">
                  {goals.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Month</label>
                  <select value={formMonth} onChange={(e) => setFormMonth(e.target.value)} className="form-select">
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Year</label>
                  <select value={formYear} onChange={(e) => setFormYear(e.target.value)} className="form-select">
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => handleAddSubmit(false)}
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 24px', fontWeight: 600 }}
                >
                  {formSubmitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DISPATCH REMINDER MODAL --- */}
      {activeModal === 'REMINDER' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Monthly Payment Reminder
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              {reminderCmtIds.length > 0
                ? `Send payment reminders to ${reminderCmtIds.length} selected commitment${reminderCmtIds.length > 1 ? 's' : ''}.`
                : 'Select savings commitments to send reminders for.'}
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReminderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Multi-select commitments */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Commitments (select multiple)</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '240px', overflowY: 'auto', backgroundColor: 'var(--bg-surface)' }}>
                  {commitments.filter((c) => c.status === 'ACTIVE' || c.status === 'PENDING').map((c) => {
                    const isChecked = reminderCmtIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: isChecked ? 'rgba(46,58,78,0.08)' : 'transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReminderCmtIds((prev) => [...prev, c.id]);
                            } else {
                              setReminderCmtIds((prev) => prev.filter((id) => id !== c.id));
                            }
                          }}
                          style={{ width: '16px', height: '16px', accentColor: '#2e3a4e', flexShrink: 0 }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{c.memberName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.id} • £{c.amount}/mo • Payout: {c.collectionMonth} {c.collectionYear}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {reminderCmtIds.length > 0 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '6px', fontWeight: 600 }}>
                    {reminderCmtIds.length} commitment{reminderCmtIds.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || reminderCmtIds.length === 0}
                  className="btn btn-primary"
                  style={{ flex: 1.2 }}
                >
                  <BellRing size={16} />
                  <span>{formSubmitting ? 'Sending...' : `Send ${reminderCmtIds.length > 1 ? `${reminderCmtIds.length} Reminders` : 'Reminder'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW COMMITMENT DETAILS MODAL --- */}
      {activeModal === 'VIEW_COMMITMENT' && selectedCmt && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '640px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <PoundSterling size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-title)', margin: 0 }}>Saving Commitment</h3>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', paddingLeft: '30px' }}>{selectedCmt.id}</div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Record ID</span>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', marginTop: '4px', fontSize: '0.85rem' }}>{selectedCmt.id}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Name</span>
                <div style={{ marginTop: '4px' }}>
                  <button
                    onClick={() => {
                      router.push(`/dashboard/users?search=${encodeURIComponent(selectedCmt.memberName)}`);
                      setActiveModal('NONE');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline', textUnderlineOffset: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Go to Manage Users"
                  >
                    {selectedCmt.memberName}
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collection Month</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>{selectedCmt.collectionMonth} {selectedCmt.collectionYear}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Amount (£)</span>
                <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '4px', fontSize: '1rem' }}>£{Number(selectedCmt.amount).toFixed(2)}</div>
              </div>
              
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`status-pill ${selectedCmt.status.toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.72rem' }}>
                    {selectedCmt.status === 'NOT_YET_STARTED' ? 'Pending' : selectedCmt.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History Table */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</h4>
            {viewCmtLoading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading payments...</div>
            ) : viewCmtPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                No payments logged yet for this commitment.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-subtle, #f1f5f9)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SR.NO.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Month</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Year</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewCmtPayments.map((pay, i) => (
                      <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle, #fafafa)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{pay.month}</td>
                        <td style={{ padding: '10px 14px' }}>{pay.year}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#16a34a' }}>£{Number(pay.amount).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`status-pill ${pay.status === 'CONFIRMED' ? 'active' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                            {pay.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ borderRadius: '8px', padding: '8px 22px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT FOR PAST MONTH MODAL --- */}
      {activeModal === 'PAST_PAYMENT' && selectedCmt && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Payment for Past Month
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Record a historical monthly payment for <strong>{selectedCmt.memberName}</strong> — {selectedCmt.id}.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePastPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Payment: Month's Payment */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Month&apos;s Payment</label>
                <select value={pastPayMonth} onChange={(e) => setPastPayMonth(e.target.value)} className="form-select" required>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Collection Month */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Collection Month</label>
                <select value={pastPayCollectionMonth} onChange={(e) => setPastPayCollectionMonth(e.target.value)} className="form-select">
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Send Notification */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Send Notification</label>
                <select value={pastPaySendNotification} onChange={(e) => setPastPaySendNotification(e.target.value as 'yes' | 'no')} className="form-select">
                  <option value="" disabled>Choose...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {formSubmitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT COMMITMENT MODAL --- */}
      {activeModal === 'EDIT' && selectedCmt && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content">
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Edit Commitment Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Modify settings for commitment cycle ID: {selectedCmt.id}.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Target Goal</label>
                <select value={formGoal} onChange={(e) => setFormGoal(e.target.value)} className="form-select">
                  {goals.map((g) => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Savings Monthly Amount (£)</label>
                <select value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="form-select">
                  {amounts.map((a) => (
                    <option key={a.amount} value={a.amount}>£{a.amount}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Month</label>
                  <select value={formMonth} onChange={(e) => setFormMonth(e.target.value)} className="form-select">
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Collection Year</label>
                  <select value={formYear} onChange={(e) => setFormYear(e.target.value)} className="form-select">
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cycle Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="form-select">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
