'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Plus, Eye, Edit, Trash2, X, MoreVertical, ShieldAlert, CheckCircle, FileText, CalendarRange, Star, Mail, AlertTriangle, AlertCircle, Download, Upload } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
import PaginationControls from '../PaginationControls';
import styles from './users.module.css';

interface User {
  id: string;
  displayId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: boolean;
  membership?: string;
  createdAt: string;
  invitationId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postCode?: string;
  country?: string;
  permissions?: string[];
  membershipFeeConfirmed?: boolean;
  membershipFeeConfirmedAt?: string | null;
  termsAccepted?: boolean;
  isSuperAdmin?: boolean;
}

export default function ManageUsersPage() {
  const dialog = useDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);


  // Modal States
  const [activeModal, setActiveModal] = useState<'NONE' | 'ADD' | 'EDIT' | 'VIEW' | 'DELETE_CONFIRM' | 'BULK_DELETE_CONFIRM' | 'MEMBERSHIP_DETAILS' | 'AGREEMENT' | 'SCHEDULE' | 'REVIEWS' | 'REQUEST_FEE' | 'CONFIRM_REQUEST_FEE' | 'CONFIRM_FEE_FORM' | 'CONFIRM_FEE_POPUP' | 'REMIND_FEE_POPUP' | 'DEACTIVATE_CONFIRM' | 'ACTIVATE_CONFIRM'>('NONE');
  const [deactivationReason, setDeactivationReason] = useState('');
  const [deactivationError, setDeactivationError] = useState('');
  const [membershipAgreement, setMembershipAgreement] = useState('');
  const [feeSchedule, setFeeSchedule] = useState('');

  const [feeBase, setFeeBase] = useState('200');
  const [feeAdmin, setFeeAdmin] = useState('30');
  const [feeYear, setFeeYear] = useState('2027');
  const [feePaidAmount, setFeePaidAmount] = useState('230');
  const [feePaidDate, setFeePaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [userFeeRecords, setUserFeeRecords] = useState<any[]>([]);
  const [userSavingsByYear, setUserSavingsByYear] = useState<Record<number, number>>({});
  const [userCommitmentsList, setUserCommitmentsList] = useState<any[]>([]);
  const [allCommitmentsList, setAllCommitmentsList] = useState<any[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editBaseFee, setEditBaseFee] = useState<string>('200');
  const [editAdminFee, setEditAdminFee] = useState<string>('30');
  const [editYear, setEditYear] = useState<string>('2028');

  // Migration Modal State
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [migrationMode, setMigrationMode] = useState<'CSV' | 'JSON'>('CSV');
  const [migrationCsvText, setMigrationCsvText] = useState('');
  const [migrationJson, setMigrationJson] = useState('');
  const [migrationOverwrite, setMigrationOverwrite] = useState(true);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const [migrationError, setMigrationError] = useState('');

  const parseCsvToPayload = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { users: [], commitments: [] };

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',');
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const idxMemberId = getIdx(['member id', 'memberid', 'invitation id', 'invitationid', 'display id', 'code']);
    const idxName = getIdx(['name', 'full name', 'fullname', 'member name']);
    const idxEmail = getIdx(['email', 'mail']);
    const idxPhone = getIdx(['phone', 'mobile', 'tel', 'contact']);
    const idxRole = getIdx(['role']);
    const idxAmount = getIdx(['amount', 'savings', 'commitment']);
    const idxMonth = getIdx(['month', 'collection month']);
    const idxYear = getIdx(['year', 'collection year']);

    const usersList: any[] = [];
    const commitmentsList: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length === 0 || cols.every(c => !c)) continue;

      const email = idxEmail !== -1 && cols[idxEmail] ? cols[idxEmail] : '';
      const memberId = idxMemberId !== -1 && cols[idxMemberId] ? cols[idxMemberId] : '';
      const name = idxName !== -1 && cols[idxName] ? cols[idxName] : '';
      const phone = idxPhone !== -1 && cols[idxPhone] ? cols[idxPhone] : '';
      const role = idxRole !== -1 && cols[idxRole] ? cols[idxRole] : 'MEMBER';
      const amount = idxAmount !== -1 ? parseFloat(cols[idxAmount]) || 0 : 0;
      const month = idxMonth !== -1 && cols[idxMonth] ? cols[idxMonth] : 'February';
      const year = idxYear !== -1 ? parseInt(cols[idxYear], 10) || 2026 : 2026;

      if (email || memberId || name) {
        usersList.push({
          invitationId: memberId || undefined,
          name: name || (email ? email.split('@')[0] : 'Member'),
          email: email,
          phone: phone,
          role: role.toUpperCase().includes('ADMIN') ? 'ADMIN' : 'MEMBER',
          isActive: true
        });

        if (amount > 0) {
          commitmentsList.push({
            memberEmail: email,
            memberId: memberId,
            amount: amount,
            goal: 'Savings Goal',
            collectionMonth: month,
            collectionYear: year,
            status: 'ACTIVE'
          });
        }
      }
    }

    return { users: usersList, commitments: commitmentsList };
  };

  const validateUkPhoneNumber = (phoneStr: string) => {
    if (!phoneStr) return false;
    const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
    if (/^\+44\d{10}$/.test(cleaned)) return true;
    if (/^0\d{10}$/.test(cleaned)) return true;
    if (/^44\d{10}$/.test(cleaned)) return true;
    return false;
  };

  const getMembershipFee = (membership?: string) => {
    if (!membership) return '5.00';
    if (membership.includes('VIP')) return '25.00';
    if (membership.includes('Premium')) return '10.00';
    const val = parseFloat(membership);
    return isNaN(val) ? '5.00' : val.toFixed(2);
  };
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Form Fields
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [formMembership, setFormMembership] = useState('Standard Saver');

  // Address fields
  const [formAddressLine1, setFormAddressLine1] = useState('');
  const [formAddressLine2, setFormAddressLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPostCode, setFormPostCode] = useState('');
  const [formCountry, setFormCountry] = useState('United Kingdom');

  // Permissions checked array
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formIsSuperAdmin, setFormIsSuperAdmin] = useState(false);

  // Dropdown menus active index
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setSelectedUserIds([]); // Clear selection on successful load
      }
      const cmtRes = await fetch('/api/admin/commitments');
      if (cmtRes.ok) {
        const cData = await cmtRes.json();
        setAllCommitmentsList(Array.isArray(cData) ? cData : []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error('Error fetching session:', err));

    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.membershipAgreement) setMembershipAgreement(data.membershipAgreement);
        if (data.feeSchedule) setFeeSchedule(data.feeSchedule);
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  useEffect(() => {
    // Pre-fill search from URL ?search= param (used when navigating from Commitments page via member name)
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    const approveId = searchParams.get('approveSuperAdmin');
    if (approveId && users.length > 0) {
      const targetUser = users.find((u) => u.id === approveId);
      const userName = targetUser ? targetUser.name : 'this user';
      (async () => {
        const confirmApprove = await dialog.confirm(
          'Approve Super Admin Request',
          `An administrator requested Super Admin promotion for ${userName}. Do you want to accept and grant Super Admin privileges to ${userName}?`
        );
        if (confirmApprove) {
          try {
            const res = await fetch('/api/admin/users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: approveId,
                isSuperAdmin: true,
                role: 'ADMIN',
                approveRequest: true
              })
            });
            if (res.ok) {
              await dialog.alert('Promotion Approved', `Super Admin privileges have been successfully granted to ${userName}!`);
              fetchUsers();
              router.replace('/dashboard/users');
            } else {
              const data = await res.json();
              await dialog.alert('Error', data.error || 'Failed to approve Super Admin promotion.');
            }
          } catch (err) {
            console.error('Approve error:', err);
          }
        }
      })();
    }
  }, [searchParams, users]);

  const handleOpenAddModal = () => {
    setErrorMsg('');
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('MEMBER');
    setFormMembership('Standard Saver');
    setFormAddressLine1('');
    setFormAddressLine2('');
    setFormCity('');
    setFormPostCode('');
    setFormCountry('United Kingdom');
    setFormPermissions(['INVITE_USER', 'ASSIGN_UNAVAILABLE_MONTH']);
    setActiveModal('ADD');
  };

  const handleOpenEditModal = (user: User) => {
    setErrorMsg('');
    setSelectedUser(user);
    
    // Split name safely if firstName/lastName aren't populated yet
    const splitFirstName = user.firstName || user.name.split(' ')[0] || '';
    const splitLastName = user.lastName || user.name.split(' ').slice(1).join(' ') || '';

    setFormFirstName(splitFirstName);
    setFormLastName(splitLastName);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormRole(user.role);
    setFormIsSuperAdmin(!!user.isSuperAdmin);
    setFormMembership(user.membership || 'Standard Saver');
    setFormAddressLine1(user.addressLine1 || '');
    setFormAddressLine2(user.addressLine2 || '');
    setFormCity(user.city || '');
    setFormPostCode(user.postCode || '');
    setFormCountry(user.country || 'United Kingdom');
    setFormPermissions(user.permissions || []);
    setActiveModal('EDIT');
    setOpenDropdownId(null);
  };

  const handleOpenViewModal = async (user: User) => {
    setSelectedUser(user);
    setActiveModal('VIEW');
    setOpenDropdownId(null);
    setUserFeeRecords([]);
    setUserSavingsByYear({});

    try {
      const feeRes = await fetch(`/api/admin/users/membership-fee?userId=${user.id}`);
      if (feeRes.ok) {
        const records = await feeRes.json();
        setUserFeeRecords(records);
      }

      const commRes = await fetch('/api/admin/commitments');
      if (commRes.ok) {
        const data = await commRes.json();
        const allCommitments = data || [];
        const userCommitments = Array.isArray(allCommitments) ? allCommitments.filter((c: any) => c.memberId === user.id) : [];

        const savingsMap: Record<number, number> = {};
        userCommitments.forEach((c: any) => {
          const yr = Number(c.collectionYear) || new Date().getFullYear();
          if (c.status === 'COMPLETED' || c.status === 'ACTIVE') {
            savingsMap[yr] = (savingsMap[yr] || 0) + (Number(c.amount) || 0);
          }
        });
        setUserSavingsByYear(savingsMap);
      }
    } catch (err) {
      console.error('Error fetching view membership data:', err);
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setActiveModal('DELETE_CONFIRM');
    setOpenDropdownId(null);
  };

  const handleOpenMembershipModal = (user: User) => {
    setSelectedUser(user);
    setActiveModal('MEMBERSHIP_DETAILS');
  };

  const handleOpenRequestFeeModal = (user: User) => {
    setSelectedUser(user);
    setFeeBase('200');
    setFeeAdmin('30');
    setFeeYear(String(new Date().getFullYear() + 2));
    setActiveModal('REQUEST_FEE');
    setOpenDropdownId(null);
  };

  const handleOpenConfirmFeeModal = async (user: User) => {
    setSelectedUser(user);
    setOpenDropdownId(null);
    setFeePaidDate(new Date().toISOString().split('T')[0]);

    try {
      const res = await fetch(`/api/admin/users/membership-fee?userId=${user.id}`);
      if (res.ok) {
        const records = await res.json();
        const pending = records.find((r: any) => r.status === 'PENDING') || records[0];
        if (pending) {
          setFeeBase(String(pending.baseFee || 200));
          setFeeAdmin(String(pending.adminFee || 30));
          setFeeYear(String(pending.year || 2028));
        } else {
          setFeeBase('200');
          setFeeAdmin('30');
          setFeeYear('2028');
        }
      }
    } catch (err) {
      setFeeBase('200');
      setFeeAdmin('30');
      setFeeYear('2028');
    }
    setActiveModal('CONFIRM_FEE_FORM');
  };

  const handleOpenReminderPopup = (user: User) => {
    setSelectedUser(user);
    setActiveModal('REMIND_FEE_POPUP');
    setOpenDropdownId(null);
  };

  const handleStartEditRecord = (rec: any) => {
    setEditingRecordId(rec.id);
    setEditBaseFee(String(rec.baseFee || 200));
    setEditAdminFee(String(rec.adminFee || 30));
    setEditYear(String(rec.year || 2028));
  };

  const handleSaveInlineFeeEdit = async (recordId: string) => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/membership-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT',
          userId: selectedUser.id,
          recordId,
          baseFee: parseFloat(editBaseFee) || 0,
          adminFee: parseFloat(editAdminFee) || 0,
          year: editYear
        })
      });
      if (res.ok) {
        setEditingRecordId(null);
        const res2 = await fetch(`/api/admin/users/membership-fee?userId=${selectedUser.id}`);
        if (res2.ok) {
          setUserFeeRecords(await res2.json());
        }
        await dialog.alert('Record Updated', 'Membership fee record updated successfully.');
      } else {
        const data = await res.json();
        await dialog.alert('Error', data.error || 'Failed to update record.');
      }
    } catch (err) {
      console.error('Save fee edit error:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRequestFeeSubmit = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/membership-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST',
          userId: selectedUser.id,
          year: feeYear,
          baseFee: parseFloat(feeBase) || 0,
          adminFee: parseFloat(feeAdmin) || 0
        })
      });
      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
        await dialog.alert('Fee Request Sent', `Membership fee request of £${((parseFloat(feeBase) || 0) + (parseFloat(feeAdmin) || 0)).toFixed(2)} for ${feeYear} has been created and sent to ${selectedUser.name}.`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to send fee request.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmFeeSubmit = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    const totalAmount = (parseFloat(feeBase) || 0) + (parseFloat(feeAdmin) || 0);
    try {
      const res = await fetch('/api/admin/users/membership-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAYMENT',
          userId: selectedUser.id,
          year: feeYear,
          amountPaid: totalAmount,
          paidAt: feePaidDate
        })
      });
      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
        await dialog.alert('Fee Confirmed', `Membership fee payment of £${totalAmount.toFixed(2)} for ${selectedUser.name} has been confirmed and receipt email sent.`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to confirm fee payment.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSendFeeReminderSubmit = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/membership-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REMIND',
          userId: selectedUser.id
        })
      });
      if (res.ok) {
        setActiveModal('NONE');
        await dialog.alert('Reminder Sent', `Membership fee payment reminder email sent to ${selectedUser.email}.`);
      } else {
        await dialog.alert('Error', 'Failed to send payment reminder.');
      }
    } catch (err) {
      console.error('Reminder error:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddSubmit = async (inviteMode: 'SAVE' | 'SAVE_INVITE') => {
    setErrorMsg('');
    if (!formFirstName || !formEmail || !formPhone || !formRole) {
      setErrorMsg('First Name, Email, Phone, and Access Role are required.');
      return;
    }

    if (!validateUkPhoneNumber(formPhone)) {
      setErrorMsg('Phone Number must be a valid number. (UK eg.+447975556677)');
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          membership: formMembership,
          addressLine1: formAddressLine1,
          addressLine2: formAddressLine2,
          city: formCity,
          postCode: formPostCode,
          country: formCountry,
          permissions: formPermissions,
          inviteMode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
      } else {
        setErrorMsg(data.error || 'Failed to add user.');
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

    if (!selectedUser) return;

    if (!validateUkPhoneNumber(formPhone)) {
      setErrorMsg('Phone Number must be a valid number. (UK eg.+447975556677)');
      return;
    }
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          isSuperAdmin: formIsSuperAdmin,
          membership: formMembership,
          addressLine1: formAddressLine1,
          addressLine2: formAddressLine2,
          city: formCity,
          postCode: formPostCode,
          country: formCountry,
          permissions: formPermissions
        }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
        if (data.pendingSuperAdmin) {
          await dialog.alert('Super Admin Request Submitted', data.message || 'Super Admin request submitted! An email confirmation has been sent to the Super Admin for approval.');
        }
      } else {
        setErrorMsg(data.error || 'Failed to update user.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = (user: User, checkTargetState: boolean) => {
    setSelectedUser(user);
    if (!checkTargetState) {
      // User is currently active, trying to DEACTIVATE
      setDeactivationReason('');
      setDeactivationError('');
      setActiveModal('DEACTIVATE_CONFIRM');
    } else {
      // User is currently inactive, trying to ACTIVATE
      setActiveModal('ACTIVATE_CONFIRM');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedUser) return;
    if (!deactivationReason) {
      setDeactivationError('Please select a reason for deactivation.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          isActive: false,
          deactivationReason
        }),
      });

      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setDeactivationError(data.error || 'Failed to deactivate user.');
      }
    } catch (err) {
      setDeactivationError('A network error occurred while deactivating user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          isActive: true
        }),
      });

      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        await dialog.alert('Status Error', data.error || 'Failed to activate user.');
      }
    } catch (err) {
      await dialog.alert('Status Error', 'A network error occurred while activating user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmFee = async (userId: string) => {
    setOpenDropdownId(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, membershipFeeConfirmed: true }),
      });
      if (res.ok) {
        fetchUsers();
        await dialog.alert('Fee Confirmed', 'Membership fee confirmed successfully!');
      } else {
        const data = await res.json();
        await dialog.alert('Fee Error', data.error || 'Failed to confirm fee.');
      }
    } catch (err) {
      console.error('Error confirming membership fee:', err);
    }
  };

  const handleResendInvite = async (userId: string) => {
    setOpenDropdownId(null);
    const confirmed = await dialog.confirm(
      'Send Access Link',
      'Are you sure you want to send the setup and password activation access link to this user?'
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'send_invite' }),
      });
      if (res.ok) {
        await dialog.alert('Access Link Sent', 'Activation and access link has been successfully sent to the user!');
      } else {
        const data = await res.json();
        await dialog.alert('Error', data.error || 'Failed to send invitation email.');
      }
    } catch (err) {
      console.error('Error sending access link:', err);
      await dialog.alert('Error', 'A network error occurred while sending access link.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendResetLink = async (userId: string) => {
    setOpenDropdownId(null);
    const confirmed = await dialog.confirm(
      'Reset Password',
      'Are you sure you want to send a password reset link to this user via email?'
    );
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'send_reset' }),
      });
      if (res.ok) {
        await dialog.alert('Link Sent', 'Password reset link has been successfully emailed to the user!');
      } else {
        const data = await res.json();
        await dialog.alert('Error', data.error || 'Failed to send password reset link.');
      }
    } catch (err) {
      console.error('Error sending reset link:', err);
      await dialog.alert('Error', 'A network error occurred while sending reset link.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
      } else {
        setActiveModal('NONE');
        await dialog.alert(
          'Oops...',
          data.error || 'This user have a already a saving commitment'
        );
      }
    } catch (err) {
      setActiveModal('NONE');
      await dialog.alert('Oops...', 'This user have a already a saving commitment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const deletableIds = paginatedUsers
        .filter(u => !u.isSuperAdmin && u.id !== currentUser?.id)
        .map(u => u.id);
      // Add page selections to existing selections (don't clear other pages)
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...deletableIds])));
    } else {
      // Remove only current page users from selection
      const pageIds = new Set(paginatedUsers.map(u => u.id));
      setSelectedUserIds(prev => prev.filter(id => !pageIds.has(id)));
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId]);
    } else {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setIsBulkDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/admin/users?ids=${selectedUserIds.join(',')}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedUserIds([]);
        fetchUsers();
        setActiveModal('NONE');
        // Show partial result info if some were skipped
        if (data.errors && data.errors.length > 0) {
          await dialog.alert(
            `Deleted ${data.deletedIds?.length || 0} user(s)`,
            `The following could not be deleted (they have savings commitments):\n\n${data.errors.join('\n')}`
          );
        }
      } else {
        setActiveModal('NONE');
        // Even on 400, partial deletes may have happened — refresh
        fetchUsers();
        setSelectedUserIds([]);
        await dialog.alert(
          'Some users could not be deleted',
          data.error || 'One or more users have an active savings commitment and were skipped.'
        );
      }
    } catch (err) {
      setActiveModal('NONE');
      await dialog.alert('Error', 'A network error occurred while deleting users.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handlePermissionChange = (perm: string, checked: boolean) => {
    if (checked) {
      setFormPermissions([...formPermissions, perm]);
    } else {
      setFormPermissions(formPermissions.filter(p => p !== perm));
    }
  };

  const toggleDropdown = (userId: string) => {
    setOpenDropdownId(openDropdownId === userId ? null : userId);
  };

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [userStatusFilter, setUserStatusFilter] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    
    // Status matching
    const isActiveStatus = userStatusFilter === 'ACTIVE';
    const isInvitedStatus = userStatusFilter === 'INVITED';
    const matchesStatus = !userStatusFilter || (isActiveStatus && u.isActive) || (isInvitedStatus && !u.isActive);
    
    if (!matchesStatus) return false;
    
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.displayId && u.displayId.toLowerCase().includes(q))
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const idA = (a.displayId || a.invitationId || a.id || '').toString();
    const idB = (b.displayId || b.invitationId || b.id || '').toString();
    return sortOrder === 'asc'
      ? idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' })
      : idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Pagination
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [usersPage, setUsersPage] = useState(1);
  const totalUsersPages = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));
  const paginatedUsers = sortedUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

  // Reset to page 1 when search changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setUsersPage(1);
  };

  return (
    <div>
      {isProcessing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Processing request...</span>
        </div>
      )}
      {/* Page Header */}
      <div className={styles.searchBarContainer}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Users
          </h2>
        </div>
        
        {/* Top action buttons */}
        <div className={styles.topButtonsGroup} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              if (users.length === 0) return;
              const headers = ['Member ID', 'Name', 'Email', 'Phone', 'Role', 'Is Active', 'Joined Date'];
              const rows = users.map(u => [
                `"${u.displayId || u.invitationId || u.id}"`,
                `"${u.name.replace(/"/g, '""')}"`,
                `"${u.email}"`,
                `"${u.phone || ''}"`,
                `"${u.role}"`,
                `"${u.isActive ? 'Active' : 'Inactive'}"`,
                `"${new Date(u.createdAt || Date.now()).toLocaleDateString('en-GB')}"`
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `savvey_savers_members_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '8px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Download size={15} />
            <span>Export Users (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMigrationError('');
              setMigrationReport(null);
              setMigrationModalOpen(true);
            }}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '8px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }}
          >
            <Upload size={15} />
            <span>Import / Migrate Data</span>
          </button>

          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--secondary)', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className={styles.searchBarContainer} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select
            value={userStatusFilter}
            onChange={(e) => {
              setUserStatusFilter(e.target.value);
              setUsersPage(1);
            }}
            className="form-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', minWidth: '150px' }}
          >
            <option value="">All Users</option>
            <option value="ACTIVE">Active Users</option>
            <option value="INVITED">Invited Users</option>
          </select>
          {selectedUserIds.length > 0 && (
            <button
              onClick={() => { setErrorMsg(''); setActiveModal('BULK_DELETE_CONFIRM'); }}
              className="btn btn-danger btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <Trash2 size={14} />
              <span>Delete Selected ({selectedUserIds.length})</span>
            </button>
          )}
        </div>
      </div>


      {/* Users List Table */}
      {loading ? (
        <div className="glass-panel flex-center" style={{ height: '300px', flexDirection: 'column', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text-muted)' }}>Loading Members...</span>
        </div>
      ) : (
        <>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '16px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && paginatedUsers.filter(u => !u.isSuperAdmin && u.id !== currentUser?.id).every(u => selectedUserIds.includes(u.id))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ accentColor: 'var(--secondary)', cursor: 'pointer' }}
                  />
                </th>
                <th 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to toggle sorting order by ID (Ascending / Descending)"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>Invitation ID</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>
                      {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
                    </span>
                  </div>
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th>Created On</th>
                <th>Is Active</th>
                <th>Membership</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const isBottomRow = idx >= 2 && paginatedUsers.length >= 4 && idx >= paginatedUsers.length - 2;
                  return (
                  <tr key={u.id} style={selectedUserIds.includes(u.id) ? { backgroundColor: 'rgba(255, 255, 255, 0.02)' } : undefined}>
                    <td style={{ paddingLeft: '16px' }}>
                      {!u.isSuperAdmin && u.id !== currentUser?.id && (
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={(e) => handleSelectUser(u.id, e.target.checked)}
                          style={{ accentColor: 'var(--secondary)', cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.displayId || u.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>

                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span className={`status-pill ${u.role === 'ADMIN' ? 'completed' : 'active'}`} style={{ fontSize: '0.7rem' }}>
                          {u.role === 'ADMIN' ? 'Admin' : 'Member'}
                        </span>
                        {u.isSuperAdmin && (
                          <span className="status-pill" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                            Super Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={u.isActive}
                          onChange={(e) => handleToggleActive(u, e.target.checked)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenViewModal(u)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.85rem'
                        }}
                      >
                        View Membership
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', position: 'relative' }}>
                      <div className={styles.actionsDropdown}>
                        <button onClick={() => toggleDropdown(u.id)} className={styles.dropdownTrigger}>
                          <MoreVertical size={16} />
                        </button>
                        {openDropdownId === u.id && (
                          <div className={`${styles.dropdownMenu} ${isBottomRow ? styles.dropdownMenuUp : ''}`}>
                            <button onClick={() => handleOpenViewModal(u)} className={styles.dropdownItem}>
                              <Eye size={14} />
                              <span>View Details</span>
                            </button>
                            <button onClick={() => handleOpenEditModal(u)} className={styles.dropdownItem}>
                              <Edit size={14} />
                              <span>Edit Details</span>
                            </button>
                            <button onClick={() => handleOpenRequestFeeModal(u)} className={styles.dropdownItem}>
                              <FileText size={14} />
                              <span>Request Membership Fee</span>
                            </button>
                            <button onClick={() => handleOpenConfirmFeeModal(u)} className={styles.dropdownItem}>
                              <CheckCircle size={14} />
                              <span>Confirm Membership Fee</span>
                            </button>
                            <button onClick={() => handleOpenReminderPopup(u)} className={styles.dropdownItem}>
                              <Mail size={14} />
                              <span>Request Member To Pay Up</span>
                            </button>
                             {!u.isActive ? (
                              <button onClick={() => handleResendInvite(u.id)} className={styles.dropdownItem}>
                                <Mail size={14} />
                                <span>Send Access Link</span>
                              </button>
                            ) : (
                              <button onClick={() => handleSendResetLink(u.id)} className={styles.dropdownItem}>
                                <Mail size={14} />
                                <span>Reset Password Link</span>
                              </button>
                            )}
                            {!u.isSuperAdmin && u.id !== currentUser?.id && (
                              <button onClick={() => handleOpenDeleteModal(u)} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
          currentPage={usersPage}
          totalPages={totalUsersPages}
          totalItems={sortedUsers.length}
          itemsPerPage={usersPerPage}
          onPageChange={setUsersPage}
          onItemsPerPageChange={(num) => { setUsersPerPage(num); setUsersPage(1); }}
          itemLabel="member"
        />
        </>
      )}

      {/* --- ADD MEMBER MODAL --- */}
      {activeModal === 'ADD' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Add Member
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Create a new user profile with invitation controls.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="Jane" className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Smith" className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address *</label>
                  <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="jane@example.com" className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone *</label>
                  <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+44 7700 900011" className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Address Line 1</label>
                  <input type="text" value={formAddressLine1} onChange={(e) => setFormAddressLine1(e.target.value)} placeholder="10 Downing St" className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Address Line 2</label>
                  <input type="text" value={formAddressLine2} onChange={(e) => setFormAddressLine2(e.target.value)} placeholder="Westminster" className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City</label>
                  <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="London" className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Post Code</label>
                  <input type="text" value={formPostCode} onChange={(e) => setFormPostCode(e.target.value)} placeholder="SW1A 2AA" className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    value="United Kingdom"
                    disabled
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: '0 0 16px 0' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>Select Role *</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value as any)} className="form-select" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="MEMBER">Savers</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {/* Permission Checklist (Matching User Screenshot) */}
              <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginBottom: '8px', display: 'block' }}>
                  Permission
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formPermissions.includes('SETUP_ADMIN')} onChange={(e) => handlePermissionChange('SETUP_ADMIN', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                    <span>Setup Admin</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formPermissions.includes('INVITE_USER')} onChange={(e) => handlePermissionChange('INVITE_USER', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                    <span>Invite User</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formPermissions.includes('ASSIGN_UNAVAILABLE_MONTH')} onChange={(e) => handlePermissionChange('ASSIGN_UNAVAILABLE_MONTH', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                    <span>Assign Unavailable month to users</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formPermissions.includes('RECEIVE_UNAVAILABLE_APPROVAL')} onChange={(e) => handlePermissionChange('RECEIVE_UNAVAILABLE_APPROVAL', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                    <span>Receive Unavailable Month Approval Requests</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formPermissions.includes('SUSPEND_USER')} onChange={(e) => handlePermissionChange('SUSPEND_USER', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                    <span>Suspend User</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formPermissions.includes('DELETE_USER')} onChange={(e) => handlePermissionChange('DELETE_USER', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1e293b' }} />
                    <span>Delete User</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="btn btn-secondary"
                  style={{ flex: 1, backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddSubmit('SAVE')}
                  disabled={formSubmitting}
                  className="btn btn-secondary"
                  style={{ flex: 1.2, backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                >
                  Save
                </button>
                <button
                  onClick={() => handleAddSubmit('SAVE_INVITE')}
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1.5, backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '8px', padding: '10px', fontWeight: 600 }}
                >
                  Save & Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT MEMBER MODAL --- */}
      {activeModal === 'EDIT' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Edit Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Modify registered details and permissions for {selectedUser.name}.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input type="text" required value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address *</label>
                  <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone Number *</label>
                  <input type="tel" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Address Line 1</label>
                  <input type="text" value={formAddressLine1} onChange={(e) => setFormAddressLine1(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Address Line 2</label>
                  <input type="text" value={formAddressLine2} onChange={(e) => setFormAddressLine2(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City</label>
                  <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Post Code</label>
                  <input type="text" value={formPostCode} onChange={(e) => setFormPostCode(e.target.value)} className="form-input" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    value="United Kingdom"
                    disabled
                    readOnly
                    className="form-input"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Select Role *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormRole('SUPER_ADMIN' as any);
                      setFormIsSuperAdmin(true);
                    }}
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Request Super Admin Access
                  </button>
                </div>
                <select
                  value={formIsSuperAdmin ? 'SUPER_ADMIN' : formRole}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'SUPER_ADMIN') {
                      setFormRole('ADMIN');
                      setFormIsSuperAdmin(true);
                    } else {
                      setFormRole(val as 'ADMIN' | 'MEMBER');
                      setFormIsSuperAdmin(false);
                    }
                  }}
                  className="form-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="MEMBER">Savers</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {/* Permissions Checkboxes Section matching Savvey Savers */}
              <div className={styles.permissionSection}>
                <h4 className={styles.permissionSectionTitle}>Permissions</h4>
                <div className={styles.permissionGrid}>
                  <label className={styles.permissionLabel}>
                    <input
                      type="checkbox"
                      checked={formPermissions.includes('SETUP_ADMIN')}
                      onChange={(e) => handlePermissionChange('SETUP_ADMIN', e.target.checked)}
                    />
                    <span>Setup Admin</span>
                  </label>
                  <label className={styles.permissionLabel}>
                    <input
                      type="checkbox"
                      checked={formPermissions.includes('INVITE_USER')}
                      onChange={(e) => handlePermissionChange('INVITE_USER', e.target.checked)}
                    />
                    <span>Invite User</span>
                  </label>
                  <label className={styles.permissionLabel}>
                    <input
                      type="checkbox"
                      checked={formPermissions.includes('ASSIGN_UNAVAILABLE_MONTH')}
                      onChange={(e) => handlePermissionChange('ASSIGN_UNAVAILABLE_MONTH', e.target.checked)}
                    />
                    <span>Assign Unavailable month to users</span>
                  </label>
                  <label className={styles.permissionLabel}>
                    <input
                      type="checkbox"
                      checked={formPermissions.includes('RECEIVE_UNAVAILABLE_APPROVAL')}
                      onChange={(e) => handlePermissionChange('RECEIVE_UNAVAILABLE_APPROVAL', e.target.checked)}
                    />
                    <span>Receive Unavailable Month Approval Requests</span>
                  </label>
                  <label className={styles.permissionLabel}>
                    <input
                      type="checkbox"
                      checked={formPermissions.includes('SUSPEND_USER')}
                      onChange={(e) => handlePermissionChange('SUSPEND_USER', e.target.checked)}
                    />
                    <span>Suspend User</span>
                  </label>
                  <label className={styles.permissionLabel}>
                    <input
                      type="checkbox"
                      checked={formPermissions.includes('DELETE_USER')}
                      onChange={(e) => handlePermissionChange('DELETE_USER', e.target.checked)}
                    />
                    <span>Delete User</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting} className="btn btn-primary" style={{ flex: 1.5, backgroundColor: 'var(--secondary)', color: 'white' }}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MEMBERSHIP FEE MODAL (Non-Table Compact Card Layout) --- */}
      {(activeModal === 'VIEW' || activeModal === 'MEMBERSHIP_DETAILS') && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '18px', top: '18px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>

            {/* Member Profile Badge Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#2e3a4e',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-family-title)', color: '#0f172a' }}>
                    {selectedUser.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontFamily: 'monospace' }}>
                    {selectedUser.displayId || selectedUser.invitationId || selectedUser.id}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {selectedUser.email} {selectedUser.phone ? `• ${selectedUser.phone}` : ''}
                </div>
              </div>
            </div>

            {/* Membership Details Card Summary (2x2 Grid, No Tables) */}
            {(() => {
              const currentYear = new Date().getFullYear();
              const latestRecord = [...userFeeRecords].sort((a: any, b: any) => b.year - a.year)[0];
              const isPaid = latestRecord ? (latestRecord.status === 'PAID' || latestRecord.status === 'COMPLETED') : Boolean(selectedUser.membershipFeeConfirmed);
              const feeAmount = latestRecord ? (latestRecord.totalFee || 35.99) : 35.99;
              const yearValue = latestRecord ? latestRecord.year : currentYear;
              const datePaidStr = latestRecord?.paidAt
                ? new Date(latestRecord.paidAt).toLocaleDateString('en-GB')
                : (selectedUser.membershipFeeConfirmedAt
                    ? new Date(selectedUser.membershipFeeConfirmedAt).toLocaleDateString('en-GB')
                    : (selectedUser.membershipFeeConfirmed ? new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('en-GB') : 'N/A'));

              return (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      Membership Fee Details ({yearValue})
                    </span>
                    <span className={`status-pill ${isPaid ? 'completed' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                      {isPaid ? 'Paid & Active' : 'Payment Pending'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Annual Membership Fee</span>
                      <strong style={{ fontSize: '1.05rem', color: '#064e3b' }}>£{feeAmount.toFixed(2)}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Payment Received Date</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{datePaidStr}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Member Status</span>
                      <strong style={{ fontSize: '0.9rem', color: selectedUser.isActive ? '#16a34a' : '#dc2626' }}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Member Since</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                        {new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </strong>
                    </div>
                  </div>

                  {/* Inline Fee Editing for Admins */}
                  {editingRecordId && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#475569', display: 'block' }}>Fee (£)</span>
                        <input
                          type="number"
                          value={editBaseFee}
                          onChange={(e) => setEditBaseFee(e.target.value)}
                          className="form-input"
                          style={{ width: '90px', padding: '6px 8px', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#475569', display: 'block' }}>Year</span>
                        <input
                          type="number"
                          value={editYear}
                          onChange={(e) => setEditYear(e.target.value)}
                          className="form-input"
                          style={{ width: '80px', padding: '6px 8px', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveInlineFeeEdit(editingRecordId)}
                          disabled={formSubmitting}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRecordId(null)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!editingRecordId && latestRecord && (
                    <div style={{ marginTop: '12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEditRecord(latestRecord)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Edit Fee Record
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Savings Commitments List Section */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                  Savings Commitments ({userCommitmentsList.length})
                </span>
              </div>

              {userCommitmentsList.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '12px' }}>
                  No savings commitment records found for this member.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {userCommitmentsList.map((cmt: any) => (
                    <div key={cmt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                          {cmt.id} • £{Number(cmt.amount).toFixed(2)}/mo
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Collection: {cmt.collectionMonth} {cmt.collectionYear} ({cmt.endDate || 'December ' + cmt.collectionYear})
                        </div>
                      </div>
                      <span className={`status-pill ${cmt.status === 'ACTIVE' ? 'active' : (cmt.status === 'COMPLETED' ? 'completed' : 'pending')}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                        {cmt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ borderRadius: '8px', padding: '8px 22px', fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REQUEST FOR MEMBERSHIP FEE MODAL --- */}
      {activeModal === 'REQUEST_FEE' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-family-title)', color: '#111827' }}>
              Request For Membership Fee
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>Base Membership Fee *</label>
                  <input
                    type="number"
                    value={feeBase}
                    onChange={(e) => setFeeBase(e.target.value)}
                    placeholder="Enter base membership fee"
                    className="form-input"
                    style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: '8px', padding: '10px 14px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>Admin Fee</label>
                  <input
                    type="number"
                    value={feeAdmin}
                    onChange={(e) => setFeeAdmin(e.target.value)}
                    placeholder="Enter admin fee"
                    className="form-input"
                    style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: '8px', padding: '10px 14px' }}
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>Total:</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064e3b' }}>
                  £ {((parseFloat(feeBase) || 0) + (parseFloat(feeAdmin) || 0)).toFixed(2)}
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>Membership Year *</label>
                <select
                  value={feeYear}
                  onChange={(e) => setFeeYear(e.target.value)}
                  className="form-input"
                  style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: '8px', padding: '10px 14px' }}
                >
                  <option value="">Choose Membership Year</option>
                  {['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'].map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal('CONFIRM_REQUEST_FEE')}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 32px', fontWeight: 600 }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="btn btn-secondary"
                  style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 32px', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION POPUP MODAL (Screenshot Image 2) --- */}
      {activeModal === 'CONFIRM_REQUEST_FEE' && selectedUser && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px 28px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            {/* Exclamation Circle Icon matching Screenshot Image 2 */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #fed7aa', backgroundColor: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 300, lineHeight: 1 }}>!</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '12px', color: '#1f2937', fontFamily: 'var(--font-family-title)' }}>
              Request For Membership Fee
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.925rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to request membership fee payment?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleRequestFeeSubmit}
                disabled={formSubmitting}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 28px', fontWeight: 600 }}
              >
                {formSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('REQUEST_FEE')}
                className="btn btn-secondary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 28px', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM FOR MEMBERSHIP FEE FORM MODAL --- */}
      {activeModal === 'CONFIRM_FEE_FORM' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '480px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-family-title)', color: '#111827' }}>
              Confirm For Membership Fee
            </h3>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>Select Membership Year to Confirm *</label>
              <select
                value={feeYear}
                onChange={(e) => {
                  const selectedYr = e.target.value;
                  setFeeYear(selectedYr);
                  const matched = userFeeRecords.find((r: any) => String(r.year) === selectedYr);
                  if (matched) {
                    setFeeBase(String(matched.baseFee || 200));
                    setFeeAdmin(String(matched.adminFee || 30));
                  }
                }}
                className="form-input"
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: '8px', padding: '10px 14px' }}
              >
                {userFeeRecords.length > 0 ? (
                  userFeeRecords.map((r: any) => (
                    <option key={r.id || r.year} value={r.year}>
                      Year {r.year} — £{(r.totalFee || 230).toFixed(2)} ({r.status || 'PENDING'})
                    </option>
                  ))
                ) : (
                  ['2026', '2027', '2028', '2029'].map((yr) => (
                    <option key={yr} value={yr}>Year {yr}</option>
                  ))
                )}
              </select>
            </div>

            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#064e3b', marginBottom: '12px' }}>
                £ {((parseFloat(feeBase) || 0) + (parseFloat(feeAdmin) || 0)).toFixed(2)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563', fontWeight: 600 }}>Base Membership Fee :</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>£ {(parseFloat(feeBase) || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563', fontWeight: 600 }}>Admin Fee :</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>£ {(parseFloat(feeAdmin) || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4b5563', fontWeight: 600 }}>Payment Year :</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{feeYear}</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>Payment Received Date *</label>
              <input
                type="date"
                value={feePaidDate}
                onChange={(e) => setFeePaidDate(e.target.value)}
                placeholder="Enter payment received date"
                className="form-input"
                style={{ backgroundColor: '#ffffff', borderColor: '#d1d5db', borderRadius: '8px', padding: '10px 14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveModal('CONFIRM_FEE_POPUP')}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 32px', fontWeight: 600 }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="btn btn-secondary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 32px', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM MEMBERSHIP FEE POPUP MODAL --- */}
      {activeModal === 'CONFIRM_FEE_POPUP' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }} style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px 28px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #fed7aa', backgroundColor: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 300, lineHeight: 1 }}>!</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '12px', color: '#1f2937', fontFamily: 'var(--font-family-title)' }}>
              Confirm Membership Fee
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.925rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to confirm membership fee payment of £{((parseFloat(feeBase) || 0) + (parseFloat(feeAdmin) || 0)).toFixed(2)} for {selectedUser.name} and send receipt email?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleConfirmFeeSubmit}
                disabled={formSubmitting}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 28px', fontWeight: 600 }}
              >
                {formSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('CONFIRM_FEE_FORM')}
                className="btn btn-secondary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 28px', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT REMINDER CONFIRMATION POPUP MODAL --- */}
      {activeModal === 'REMIND_FEE_POPUP' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }} style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px 28px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #fed7aa', backgroundColor: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 300, lineHeight: 1 }}>!</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '12px', color: '#1f2937', fontFamily: 'var(--font-family-title)' }}>
              Request Member To Pay Up
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.925rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to send a membership fee payment reminder email to {selectedUser.name}?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleSendFeeReminderSubmit}
                disabled={formSubmitting}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 28px', fontWeight: 600 }}
              >
                {formSubmitting ? 'Sending...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="btn btn-secondary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', borderRadius: '6px', padding: '10px 28px', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MEMBERSHIP AGREEMENT MODAL --- */}
      {activeModal === 'AGREEMENT' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Membership Agreement
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Group rotating savings terms and conditions.
            </p>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, maxHeight: '350px', overflowY: 'auto', paddingRight: '10px', whiteSpace: 'pre-wrap' }}>
              {membershipAgreement || (
                <>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>1. Term of Agreement:</strong> This agreement regulates the guidelines of the Savvey Savers savings circle. By joining, members commit to a full collection rotation cycle.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>2. Payout Rotation Schedule:</strong> The schedule is generated dynamically at the cycle start. All payout requests must be approved by the circle Coordinator.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>3. Delinquency & Penalties:</strong> Late monthly deposits will trigger system notifications. Chronic delays will result in membership suspension and temporary payout deferral.
                  </p>
                  <p style={{ marginBottom: '12px' }}>
                    <strong>4. Off-Platform Settlements:</strong> All cash transfers occur offline. The platform is solely a record-keeping system. No funds are stored on this digital server.
                  </p>
                </>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEE SCHEDULE MODAL --- */}
      {activeModal === 'SCHEDULE' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Fee Schedule
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Associated administrative charges by membership tier.
            </p>

            {feeSchedule ? (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '350px', overflowY: 'auto' }}>
                {feeSchedule}
              </div>
            ) : (
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Membership Tier</th>
                    <th>Monthly Admin Fee</th>
                    <th>Payout Processing Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Standard Saver</td>
                    <td>£5.00</td>
                    <td>0.5%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Premium Gold</td>
                    <td>£10.00</td>
                    <td>0.2%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>VIP Elite</td>
                    <td>£25.00</td>
                    <td>0%</td>
                  </tr>
                </tbody>
              </table>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REVIEWS MODAL --- */}
      {activeModal === 'REVIEWS' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Reviews
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Feedback from circle members.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '4px' }}>
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "Platform makes our monthly rotations incredibly transparent. No more spreadsheet arguments!"
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>- John D. (Premium Gold)</span>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '4px' }}>
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} fill="#fbbf24" />
                  <Star size={14} style={{ opacity: 0.3 }} />
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "Great visual chart. Helps me plan which months are payout heavy."
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>- Jane S. (Standard Saver)</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {activeModal === 'DELETE_CONFIRM' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              Delete User Account
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? This action will archive all user records.
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left', fontWeight: 500 }}>
                ⚠️ <strong>Deletion Restricted:</strong> {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setActiveModal('NONE')}
                className="btn btn-secondary"
                style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={formSubmitting}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, border: 'none' }}
              >
                {formSubmitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BULK DELETE CONFIRMATION MODAL --- */}
      {activeModal === 'BULK_DELETE_CONFIRM' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              Delete Selected Users ({selectedUserIds.length})
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to delete {selectedUserIds.length} selected user accounts?
            </p>

            {errorMsg && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left', fontWeight: 500 }}>
                ⚠️ <strong>Deletion Restricted:</strong> {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setActiveModal('NONE')}
                className="btn btn-secondary"
                style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px', padding: '10px 20px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, border: 'none' }}
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- DATA MIGRATION MODAL --- */}
      {migrationModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMigrationModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '680px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setMigrationModalOpen(false)} style={{ position: 'absolute', right: '18px', top: '18px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Bulk Data Import & Migration Center
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Migrate members and savings commitments from your old platform table or CSV spreadsheet file without needing backend access.
            </p>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setMigrationMode('CSV')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: migrationMode === 'CSV' ? '#2e3a4e' : '#ffffff',
                  color: migrationMode === 'CSV' ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                📊 CSV / Table Copy-Paste
              </button>
              <button
                type="button"
                onClick={() => setMigrationMode('JSON')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: migrationMode === 'JSON' ? '#2e3a4e' : '#ffffff',
                  color: migrationMode === 'JSON' ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                💻 Raw JSON Payload
              </button>
            </div>

            {/* CSV MODE */}
            {migrationMode === 'CSV' && (
              <div>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      Instructions for Frontend Admin Data Copy
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleCsv = `Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February\nM-000375, Jane Smith, jane@example.com, 07700900011, MEMBER, 500, March`;
                        setMigrationCsvText(sampleCsv);
                      }}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Load Sample CSV
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px 0' }}>
                    1. Copy the rows from your old admin website table.<br />
                    2. Paste them below or upload a <strong>.csv</strong> spreadsheet file. Headers recognized: <code>Member ID</code>, <code>Name</code>, <code>Email</code>, <code>Phone</code>, <code>Role</code>, <code>Amount</code>, <code>Month</code>.
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => setMigrationCsvText(evt.target?.result as string || '');
                        reader.readAsText(file);
                      }
                    }}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                    Paste CSV / TSV Rows:
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`Member ID, Name, Email, Phone, Role, Commitment Amount, Collection Month\nM-000374, Iyore Ed, iypearlie@gmail.com, 07449311040, MEMBER, 1000, February`}
                    value={migrationCsvText}
                    onChange={(e) => setMigrationCsvText(e.target.value)}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* JSON MODE */}
            {migrationMode === 'JSON' && (
              <div>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                      JSON Format
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = {
                          users: [
                            {
                              invitationId: "M-000374",
                              name: "Iyore Ed",
                              email: "iypearlie@gmail.com",
                              phone: "07449311040",
                              role: "MEMBER",
                              isActive: true
                            }
                          ],
                          commitments: [
                            {
                              id: "SC-00222",
                              memberEmail: "iypearlie@gmail.com",
                              amount: 1000,
                              goal: "Savings Goal",
                              collectionMonth: "February",
                              collectionYear: 2027,
                              status: "ACTIVE"
                            }
                          ]
                        };
                        setMigrationJson(JSON.stringify(sample, null, 2));
                      }}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Load Sample JSON
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    Member IDs (<code style={{ color: '#0284c7' }}>invitationId</code>) and Record IDs (<code style={{ color: '#0284c7' }}>id</code>) will be strictly preserved.
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    rows={8}
                    placeholder={`{\n  "users": [\n    {\n      "invitationId": "M-000374",\n      "name": "Iyore Ed",\n      "email": "iypearlie@gmail.com",\n      "phone": "07449311040",\n      "role": "MEMBER",\n      "isActive": true\n    }\n  ]\n}`}
                    value={migrationJson}
                    onChange={(e) => setMigrationJson(e.target.value)}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Overwrite Option */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={migrationOverwrite}
                  onChange={(e) => setMigrationOverwrite(e.target.checked)}
                  style={{ accentColor: '#2e3a4e' }}
                />
                <span>Overwrite / Update existing records matching Email or Member ID</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                type="button"
                disabled={migrationRunning || (migrationMode === 'CSV' ? !migrationCsvText.trim() : !migrationJson.trim())}
                onClick={async () => {
                  setMigrationRunning(true);
                  setMigrationError('');
                  setMigrationReport(null);
                  try {
                    const payload = migrationMode === 'CSV' ? parseCsvToPayload(migrationCsvText) : JSON.parse(migrationJson);
                    const res = await fetch('/api/admin/migrate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...payload, dryRun: true, overwrite: migrationOverwrite })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setMigrationReport(data.report);
                    } else {
                      setMigrationError(data.error || 'Validation failed');
                    }
                  } catch (err: any) {
                    setMigrationError('Parsing error: ' + err.message);
                  } finally {
                    setMigrationRunning(false);
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontWeight: 600, borderRadius: '8px', fontSize: '0.85rem' }}
              >
                {migrationRunning ? 'Validating...' : 'Validate (Dry Run)'}
              </button>

              <button
                type="button"
                disabled={migrationRunning || (migrationMode === 'CSV' ? !migrationCsvText.trim() : !migrationJson.trim())}
                onClick={async () => {
                  if (!(await dialog.confirm('Confirm Migration', 'Import these records into the live database?'))) return;
                  setMigrationRunning(true);
                  setMigrationError('');
                  setMigrationReport(null);
                  try {
                    const payload = migrationMode === 'CSV' ? parseCsvToPayload(migrationCsvText) : JSON.parse(migrationJson);
                    const res = await fetch('/api/admin/migrate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...payload, dryRun: false, overwrite: migrationOverwrite })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setMigrationReport(data.report);
                      fetchUsers(); // Refresh Users table instantly!
                    } else {
                      setMigrationError(data.error || 'Migration failed');
                    }
                  } catch (err: any) {
                    setMigrationError('Parsing error: ' + err.message);
                  } finally {
                    setMigrationRunning(false);
                  }
                }}
                className="btn btn-primary"
                style={{ backgroundColor: '#2e3a4e', color: '#ffffff', padding: '8px 20px', fontWeight: 600, borderRadius: '8px', fontSize: '0.85rem' }}
              >
                {migrationRunning ? 'Importing...' : 'Execute Data Migration'}
              </button>
            </div>

            {/* Errors */}
            {migrationError && (
              <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {migrationError}
              </div>
            )}

            {/* Report */}
            {migrationReport && (
              <div style={{ backgroundColor: migrationReport.dryRun ? '#f0fdf4' : '#eff6ff', border: `1px solid ${migrationReport.dryRun ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '10px', padding: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: migrationReport.dryRun ? '#166534' : '#1e40af', marginBottom: '8px' }}>
                  {migrationReport.dryRun ? '🔍 Dry-Run Validation Summary (No Changes Saved)' : '🎉 Migration Complete!'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                  <div>Users: <strong>{migrationReport.usersProcessed}</strong> (+{migrationReport.usersCreated} new)</div>
                  <div>Commitments: <strong>{migrationReport.commitmentsProcessed}</strong> (+{migrationReport.commitmentsCreated} new)</div>
                  <div>Payments: <strong>{migrationReport.paymentsCreated}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DEACTIVATE USER CONFIRMATION MODAL --- */}
      {activeModal === 'DEACTIVATE_CONFIRM' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Deactivate User
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong>{selectedUser.name}</strong>? Please select a reason below before submitting.
            </p>

            {deactivationError && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {deactivationError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '8px', display: 'block' }}>Select a reason *</label>
              <select
                value={deactivationReason}
                onChange={(e) => { setDeactivationReason(e.target.value); setDeactivationError(''); }}
                className="form-select"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.9rem' }}
              >
                <option value="">Select a reason</option>
                <option value="Breach of Membership Terms">Breach of Membership Terms</option>
                <option value="Member left the Network">Member left the Network</option>
                <option value="Inactive Member / User">Inactive Member / User</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                disabled={formSubmitting}
                className="btn btn-secondary"
                style={{ borderRadius: '8px', padding: '9px 18px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={formSubmitting}
                className="btn btn-primary"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff', borderRadius: '8px', padding: '9px 18px', fontWeight: 600 }}
              >
                {formSubmitting ? 'Deactivating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ACTIVATE USER CONFIRMATION MODAL --- */}
      {activeModal === 'ACTIVATE_CONFIRM' && selectedUser && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('NONE'); }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px', position: 'relative' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-family-title)', color: 'var(--text-main)' }}>
              Activate User
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to reactivate this user?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                disabled={formSubmitting}
                className="btn btn-secondary"
                style={{ borderRadius: '8px', padding: '9px 18px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivate}
                disabled={formSubmitting}
                className="btn btn-primary"
                style={{ borderRadius: '8px', padding: '9px 18px', fontWeight: 600 }}
              >
                {formSubmitting ? 'Activating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
