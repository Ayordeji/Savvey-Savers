'use client';

import { useState, useEffect, Fragment, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Plus, Eye, Edit, Trash2, X, MoreVertical, BellRing, Check, PoundSterling, Calendar, ChevronDown, ChevronUp, ExternalLink, Banknote, DollarSign, ReceiptText, FileText, CheckCircle, Wallet, ArrowRight, ShieldCheck, Mail, Send } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';
import styles from './commitments.module.css';

interface Commitment {
  id: string;
  displayId?: string;
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
  email?: string;
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
  const [currentUser, setCurrentUser] = useState<{ id: string; role: 'ADMIN' | 'MEMBER'; displayId?: string; email?: string; name?: string; } | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, Payment[]>>({});
  const [users, setUsers] = useState<User[]>([]);

  // Selection & Bulk Delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setMonthFilter('');
    setYearFilter('');
    setCurrentPage(1);
  };
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Settings configs
  const [goals, setGoals] = useState<{ name: string; enabled: boolean }[]>([]);
  const [amounts, setAmounts] = useState<{ amount: number; enabled: boolean }[]>([]);

  // UI expansion states
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal states
  const [activeModal, setActiveModal] = useState<'NONE' | 'ADD' | 'EDIT' | 'REMINDER' | 'PAST_PAYMENT' | 'VIEW_COMMITMENT'>('NONE');
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      const allPaymentsRes = await fetch('/api/admin/payments');
      if (allPaymentsRes.ok) {
        const allPayments = await allPaymentsRes.json();
        const newPaymentsMap: Record<string, Payment[]> = {};
        
        // Group payments by commitment ID
        if (Array.isArray(allPayments)) {
          allPayments.forEach((p: Payment) => {
            if (!newPaymentsMap[p.commitmentId]) {
              newPaymentsMap[p.commitmentId] = [];
            }
            newPaymentsMap[p.commitmentId].push(p);
          });
        }
        
        // Ensure every fetched commitment at least has an empty array if no payments exist
        if (cmtRes.ok) {
          try {
            // Re-fetch commitments quickly just for IDs since the original response body is used
            const freshRes = await fetch('/api/admin/commitments');
            if (freshRes.ok) {
              const freshData = await freshRes.json();
              freshData.forEach((cmt: any) => {
                if (!newPaymentsMap[cmt.id]) {
                  newPaymentsMap[cmt.id] = [];
                }
              });
            }
          } catch(e) {}
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
    setViewCmtPayments(paymentsMap[cmt.id] || []);
    setViewCmtLoading(true);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/payments?commitmentId=${cmt.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewCmtPayments(data);
        setPaymentsMap((prev) => ({ ...prev, [cmt.id]: data }));
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
        router.refresh();
        await dialog.alert('Success', 'Past payment recorded successfully.');
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
        router.refresh();
        await dialog.alert('Success', 'Harvest payout released and member notified.');
      } else {
        const data = await res.json();
        await dialog.alert('Cannot Release Harvest', data.error || 'Failed to release harvest payout.');
      }
    } catch (err) {
      console.error('Error releasing harvest:', err);
      await dialog.alert('Error', 'A network error occurred while releasing harvest.');
    }
  };

  const handleDeleteCommitment = async (cmt: Commitment) => {
    setOpenDropdownId(null);
    const isCancelled = cmt.status === 'CANCELLED';
    
    if (isCancelled) {
      if (!(await dialog.confirm('Permanently Delete Commitment', 'Are you sure you want to PERMANENTLY delete this savings commitment? This action cannot be undone and it will be removed from all records.'))) return;
    } else {
      if (!(await dialog.confirm('Cancel Savings Commitment', 'Are you sure you want to cancel this savings commitment? The record will be safely archived.'))) return;
    }

    try {
      const res = await fetch(`/api/admin/commitments?id=${cmt.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Refresh
        const res2 = await fetch('/api/admin/commitments');
        if (res2.ok) {
          setCommitments(await res2.json());
        }
        router.refresh();
        await dialog.alert('Success', isCancelled ? 'Commitment permanently deleted.' : 'Commitment cancelled successfully.');
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
    if (currentUser?.role === 'MEMBER') {
      const myKeys = [
        currentUser.id,
        currentUser.displayId,
        currentUser.email,
        currentUser.name
      ].filter(Boolean).map(k => String(k).toLowerCase().trim());

      const cMemberId = c.memberId ? String(c.memberId).toLowerCase().trim() : '';
      const cMemberName = c.memberName ? String(c.memberName).toLowerCase().trim() : '';

      const isMyCmt = myKeys.includes(cMemberId) || myKeys.includes(cMemberName);
      if (!isMyCmt) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      c.memberName.toLowerCase().includes(q) ||
      c.goal.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    let matchesMonthYear = true;
    if (monthFilter || yearFilter) {
      // Check if commitment collection settings match directly
      const matchesCmtDirect =
        (!monthFilter || c.collectionMonth === monthFilter) &&
        (!yearFilter || c.collectionYear.toString() === yearFilter);

      // Check if there is any matching confirmed payment
      const cmtPayments = paymentsMap[c.id] || [];
      const hasMatchingPayment = cmtPayments.some(p => {
        if (p.status !== 'CONFIRMED') return false;
        
        const pYear = p.year.toString();
        const pMonth = p.month;
        
        if (monthFilter && yearFilter) return pMonth === monthFilter && pYear === yearFilter;
        if (monthFilter && !yearFilter) return pMonth === monthFilter;
        if (!monthFilter && yearFilter) return pYear === yearFilter;
        
        return false;
      });
      matchesMonthYear = matchesCmtDirect || hasMatchingPayment;
    }

    const matchesStatus = !statusFilter || c.status === statusFilter;

    return matchesSearch && matchesMonthYear && matchesStatus;
  });

  const sortedCommitments = [...filteredCommitments].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'id') {
      aVal = a.displayId || a.id || '';
      bVal = b.displayId || b.id || '';
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

  // KPI card metrics
  const activeCommitmentsCount = commitments.filter(c => c.status === 'ACTIVE').length;
  const totalCommittedValue = commitments
    .filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED')
    .reduce((sum, c) => sum + (Number(c.amount) || 0) * 12, 0);
  const totalCollectedValue = Object.values(paymentsMap)
    .flat()
    .filter(p => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const completedPayoutsCount = commitments.filter(c => c.status === 'COMPLETED').length;
  const totalPayoutsTarget = commitments.length;

  const monthNamesList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
            Savings Commitments
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Active pool commitments, payout dates, and monthly contribution tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {selectedIds.length > 0 && currentUser?.role === 'ADMIN' && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
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
              <Trash2 size={15} />
              <span>{isBulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}</span>
            </button>
          )}

          {selectedIds.length > 0 && currentUser?.role === 'ADMIN' && (
            <button
              onClick={handleOpenReminderModal}
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
              <BellRing size={15} />
              <span>Send Reminders ({selectedIds.length})</span>
            </button>
          )}

          {currentUser?.role === 'ADMIN' && selectedIds.length === 0 && (
            <button
              onClick={handleOpenReminderModal}
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
              <Mail size={15} />
              <span>Send Payment Reminder</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#2E5A44',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 18px',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>New Savings Commitment</span>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </button>
        </div>
      </div>

      {/* 4 KPI Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Active Commitments */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Active Commitments</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {activeCommitmentsCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>All active commitments</span>
        </div>

        {/* Card 2: Total Committed Value */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Committed Value</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            £{totalCommittedValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Annual committed value</span>
        </div>

        {/* Card 3: Total Collected */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Total Collected</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            £{totalCollectedValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Current cycle collection</span>
        </div>

        {/* Card 4: Payouts Completed */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE8E2', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Payouts Completed</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF5EE', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {completedPayoutsCount} / {totalPayoutsTarget}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Completed payouts</span>
        </div>
      </div>

      {/* Filter Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by member, pool, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                border: '1px solid #ECE8E2',
                fontSize: '0.85rem',
                backgroundColor: '#FAF9F6',
                color: '#111827',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: '10px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="">Statuses: All</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: '10px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="">Months: All</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: '10px',
              border: '1px solid #ECE8E2',
              backgroundColor: '#FAF9F6',
              color: '#374151',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="">Years: All</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          {(searchQuery || statusFilter || monthFilter || yearFilter) && (
            <button
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#D97746',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Reset
            </button>
          )}
        </div>

        {selectedIds.length > 0 && currentUser?.role === 'ADMIN' && (
          <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>
            {selectedIds.length} selected
          </div>
        )}
      </div>

      {/* Main Content Area: Table + Slide-Out Drawer */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Side: Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
              <div className="loading-spinner"></div>
              <span style={{ color: 'var(--text-muted)' }}>Loading Commitments...</span>
            </div>
          ) : (
            <div className="table-container" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #ECE8E2', overflow: 'hidden' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '1px solid #ECE8E2' }}>
                    {currentUser?.role === 'ADMIN' && (
                      <th style={{ width: '36px', textAlign: 'center', padding: '14px 10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === filteredCommitments.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#2E5A44', cursor: 'pointer' }}
                        />
                      </th>
                    )}
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      MEMBER
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      COMMITMENT ID
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      MONTHLY AMOUNT
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      TOTAL TARGET
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PAYOUT DATE
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PROGRESS
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      STATUS
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCommitments.length === 0 ? (
                    <tr>
                      <td colSpan={currentUser?.role === 'ADMIN' ? 9 : 8} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                        No savings commitments match your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedCommitments.map((c, idx) => {
                      const isBottomRow = idx >= 2 && paginatedCommitments.length >= 4 && idx >= paginatedCommitments.length - 2;
                      const displayMemberName = (c.memberName && c.memberName !== 'Unknown Member')
                        ? c.memberName
                        : (users.find(u => u.id === c.memberId || u.invitationId === c.memberId || u.name?.toLowerCase() === c.memberName?.toLowerCase())?.name || 'Member');

                      const memberUser = users.find(u => u.id === c.memberId || u.name?.toLowerCase() === c.memberName?.toLowerCase());
                      const memberEmail = memberUser?.email || `${c.memberName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
                      const initials = c.memberName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';

                      const cmtPayments = paymentsMap[c.id] || [];
                      const paidMonthsCount = cmtPayments.filter(p => p.status === 'CONFIRMED').length;
                      const progressPct = Math.min(100, Math.round((paidMonthsCount / 12) * 100));

                      const formatStatusText = (st: string) => {
                        if (st === 'NOT_YET_STARTED') return 'Pending';
                        if (st === 'ACTIVE') return 'Active';
                        if (st === 'COMPLETED') return 'Completed';
                        if (st === 'PENDING') return 'Pending';
                        if (st === 'CANCELLED') return 'Cancelled';
                        return st;
                      };

                      const isRowSelected = selectedCmt?.id === c.id && drawerOpen;

                      return (
                        <Fragment key={c.id}>
                          <tr
                            onClick={() => handleOpenViewCommitmentModal(c)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #ECE8E2',
                              backgroundColor: isRowSelected ? '#FAF9F6' : undefined,
                              transition: 'background-color 0.15s ease'
                            }}
                          >
                            {currentUser?.role === 'ADMIN' && (
                              <td style={{ textAlign: 'center', padding: '14px 10px' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(c.id)}
                                  onChange={(e) => handleSelectCommitment(c.id, e.target.checked)}
                                  style={{ width: '16px', height: '16px', accentColor: '#2E5A44', cursor: 'pointer' }}
                                />
                              </td>
                            )}

                            {/* Member Details */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: '#1B4332',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  flexShrink: 0
                                }}>
                                  {initials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                                    {displayMemberName}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                    {memberEmail}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Commitment ID */}
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                backgroundColor: '#EAF5EE',
                                color: '#2E5A44'
                              }}>
                                {c.displayId || `SC-${c.id.substring(0, 5).toUpperCase()}`}
                              </span>
                            </td>

                            {/* Monthly Amount */}
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                              £{Number(c.amount).toFixed(2)}
                            </td>

                            {/* Total Target */}
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', fontSize: '0.88rem' }}>
                              £{(Number(c.amount) * 12).toFixed(2)}
                            </td>

                            {/* Payout Date */}
                            <td style={{ padding: '14px 16px', color: '#4B5563', fontSize: '0.85rem' }}>
                              {c.collectionMonth} {c.collectionYear}
                            </td>

                            {/* Progress */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280' }}>
                                  <span>{paidMonthsCount}/12 mos</span>
                                  <span style={{ fontWeight: 600 }}>{progressPct}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: '#ECE8E2', borderRadius: '9999px', overflow: 'hidden' }}>
                                  <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#2E5A44', borderRadius: '9999px' }} />
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                backgroundColor: c.status === 'ACTIVE' ? '#EAF5EE' : c.status === 'COMPLETED' ? '#EBF5FF' : '#FEF3C7',
                                color: c.status === 'ACTIVE' ? '#2E7D32' : c.status === 'COMPLETED' ? '#2563EB' : '#B45309'
                              }}>
                                {formatStatusText(c.status)}
                              </span>
                            </td>

                            {/* Action dropdown */}
                            <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                              <div className={styles.actionsDropdown}>
                                <button onClick={() => toggleDropdown(c.id)} className={styles.dropdownTrigger}>
                                  <MoreVertical size={16} />
                                </button>
                                {openDropdownId === c.id && (
                                  <div className={`${styles.dropdownMenu} ${isBottomRow ? styles.dropdownMenuUp : ''}`}>
                                    <button onClick={() => { handleOpenViewCommitmentModal(c); setOpenDropdownId(null); }} className={styles.dropdownItem}>
                                      <Eye size={14} />
                                      <span>View Commitment</span>
                                    </button>
                                    {currentUser?.role === 'ADMIN' && (
                                      <>
                                        <button onClick={() => { handleOpenEditModal(c); setOpenDropdownId(null); }} className={styles.dropdownItem}>
                                          <Edit size={14} />
                                          <span>Edit</span>
                                        </button>
                                        
                                        {c.status !== 'CANCELLED' && (
                                          paymentsMap[c.id] === undefined ? (
                                            <button disabled className={styles.dropdownItem} style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                                              <ReceiptText size={14} />
                                              <span>Loading...</span>
                                            </button>
                                          ) : (
                                            paymentsMap[c.id].some(p => p.status === 'PENDING') ? (
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
                                          )
                                        )}

                                        {c.status !== 'CANCELLED' && (
                                          <button onClick={() => { handleOpenPastPaymentModal(c); setOpenDropdownId(null); }} className={styles.dropdownItem}>
                                            <FileText size={14} />
                                            <span>Payment For Past Month</span>
                                          </button>
                                        )}

                                        {c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && (
                                          <button onClick={() => { handleReleaseHarvest(c.id); setOpenDropdownId(null); }} className={styles.dropdownItem}>
                                            <FileText size={14} />
                                            <span>Release Harvest</span>
                                          </button>
                                        )}

                                        <button onClick={() => { handleDeleteCommitment(c); setOpenDropdownId(null); }} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                                          <X size={14} color="#dc2626" />
                                          <span style={{ color: '#dc2626' }}>
                                            {c.status === 'CANCELLED' ? 'Delete Permanently' : 'Cancel'}
                                          </span>
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
          <div style={{ marginTop: '16px' }}>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedCommitments.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => { setItemsPerPage(num); setCurrentPage(1); }}
              itemLabel="savings commitment"
            />
          </div>
        </div>

        {/* Right Side: Slide-Out Commitment Details Drawer (Matches Screenshot 3) */}
        {drawerOpen && selectedCmt && (
          <div
            style={{
              width: '440px',
              maxWidth: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #ECE8E2',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'sticky',
              top: '80px',
              flexShrink: 0
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'var(--font-family-title)' }}>
                Commitment Details
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Member Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#1B4332',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  {selectedCmt.memberName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                      {selectedCmt.memberName}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: '#EAF5EE',
                      color: '#2E7D32'
                    }}>
                      {selectedCmt.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#2E5A44', fontWeight: 700, backgroundColor: '#EAF5EE', padding: '1px 6px', borderRadius: '4px' }}>
                      {selectedCmt.displayId || `SC-${selectedCmt.id.substring(0, 5).toUpperCase()}`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      &bull; Goal: {selectedCmt.goal || 'General Savings'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Key Metrics (2x2 grid) */}
            {(() => {
              const cmtPayments = paymentsMap[selectedCmt.id] || viewCmtPayments || [];
              const paidTotal = cmtPayments.filter(p => p.status === 'CONFIRMED').reduce((s, p) => s + (Number(p.amount) || 0), 0);
              const paidCount = cmtPayments.filter(p => p.status === 'CONFIRMED').length;
              const progressPercent = Math.min(100, Math.round((paidCount / 12) * 100));

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ backgroundColor: '#FAF9F6', borderRadius: '12px', padding: '12px 14px', border: '1px solid #ECE8E2' }}>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>Monthly Contribution</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                        £{Number(selectedCmt.amount).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#FAF9F6', borderRadius: '12px', padding: '12px 14px', border: '1px solid #ECE8E2' }}>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>Total Committed</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                        £{(Number(selectedCmt.amount) * 12).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#FAF9F6', borderRadius: '12px', padding: '12px 14px', border: '1px solid #ECE8E2' }}>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>Payout Month</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2E5A44', marginTop: '4px' }}>
                        {selectedCmt.collectionMonth} {selectedCmt.collectionYear}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#FAF9F6', borderRadius: '12px', padding: '12px 14px', border: '1px solid #ECE8E2' }}>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>Total Collected</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                        £{paidTotal.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#2E7D32', fontWeight: 600, marginTop: '2px' }}>
                        {progressPercent}% completed
                      </div>
                    </div>
                  </div>

                  {/* Payment Progress Tracker (12 Month Pills) */}
                  <div style={{ backgroundColor: '#FAF9F6', borderRadius: '14px', padding: '16px', border: '1px solid #ECE8E2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>Payment Progress</span>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{paidCount} of 12 completed</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {monthNamesList.map((mName, mIdx) => {
                        const isPaid = mIdx < paidCount || cmtPayments.some(p => p.month?.toLowerCase().startsWith(mName.toLowerCase()) && p.status === 'CONFIRMED');
                        const isCurrentDue = !isPaid && mIdx === paidCount;

                        return (
                          <div
                            key={mName}
                            style={{
                              padding: '8px 4px',
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: isPaid ? '#EAF5EE' : isCurrentDue ? '#FEF3C7' : '#FFFFFF',
                              border: isPaid ? '1px solid #A7F3D0' : isCurrentDue ? '1px solid #FCD34D' : '1px solid #E5E7EB',
                              color: isPaid ? '#2E7D32' : isCurrentDue ? '#B45309' : '#9CA3AF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '3px'
                            }}
                          >
                            {isPaid && <Check size={11} strokeWidth={3} />}
                            <span>{mName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment History List */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', marginBottom: '10px' }}>
                      Payment History
                    </div>
                    {viewCmtLoading ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8rem' }}>Loading payments...</div>
                    ) : cmtPayments.length === 0 ? (
                      <div style={{ padding: '16px', backgroundColor: '#FAF9F6', borderRadius: '10px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.78rem' }}>
                        No payments logged yet for this commitment.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {cmtPayments.map((pay) => (
                          <div
                            key={pay.id}
                            style={{
                              backgroundColor: '#FAF9F6',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              border: '1px solid #ECE8E2',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#111827' }}>
                                {pay.month} {pay.year}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>
                                {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString('en-GB') : '—'} &bull; Direct Debit
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>
                                £{Number(pay.amount).toFixed(2)}
                              </div>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: pay.status === 'CONFIRMED' ? '#EAF5EE' : '#FEF3C7',
                                color: pay.status === 'CONFIRMED' ? '#2E7D32' : '#B45309'
                              }}>
                                {pay.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4 Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        const pending = cmtPayments.find(p => p.status === 'PENDING');
                        handleConfirmPayment(pending?.id, selectedCmt.id);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2E5A44',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle size={15} />
                      <span>Confirm Monthly Payment</span>
                    </button>

                    <button
                      onClick={() => handleOpenPastPaymentModal(selectedCmt)}
                      style={{
                        width: '100%',
                        padding: '9px',
                        backgroundColor: '#FFFFFF',
                        color: '#374151',
                        border: '1px solid #ECE8E2',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} />
                      <span>Add Past Payment</span>
                    </button>

                    <button
                      onClick={() => handleReleaseHarvest(selectedCmt.id)}
                      style={{
                        width: '100%',
                        padding: '9px',
                        backgroundColor: '#FFFBEB',
                        color: '#B45309',
                        border: '1px solid #FCD34D',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Banknote size={15} />
                      <span>Complete Harvest Payout</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCommitment(selectedCmt)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        color: '#DC2626',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Terminate Commitment</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

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
                            {c.displayId || c.id} • £{c.amount}/mo • Payout: {c.collectionMonth} {c.collectionYear}
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
              Record a historical monthly payment for <strong>{selectedCmt.memberName}</strong> — {selectedCmt.displayId || selectedCmt.id}.
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
              Modify settings for commitment cycle ID: {selectedCmt.displayId || selectedCmt.id}.
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
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
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
                  {(parseInt(formYear) < new Date().getFullYear() || formStatus === 'COMPLETED') && (
                    <option value="COMPLETED">COMPLETED</option>
                  )}
                  {formStatus === 'CANCELLED' && (
                    <option value="CANCELLED">CANCELLED</option>
                  )}
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
