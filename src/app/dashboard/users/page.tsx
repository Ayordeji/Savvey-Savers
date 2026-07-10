'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, X, MoreVertical, ShieldAlert, CheckCircle, FileText, CalendarRange, Star, Mail } from 'lucide-react';
import { useDialog } from '@/context/DialogContext';
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
  termsAccepted?: boolean;
  isSuperAdmin?: boolean;
}

export default function ManageUsersPage() {
  const dialog = useDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);


  // Modal States
  const [activeModal, setActiveModal] = useState<'NONE' | 'ADD' | 'EDIT' | 'VIEW' | 'DELETE_CONFIRM' | 'BULK_DELETE_CONFIRM' | 'MEMBERSHIP_DETAILS' | 'AGREEMENT' | 'SCHEDULE' | 'REVIEWS'>('NONE');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setSelectedUserIds([]); // Clear selection on successful load
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
  }, []);

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

  const handleOpenViewModal = (user: User) => {
    setSelectedUser(user);
    setActiveModal('VIEW');
    setOpenDropdownId(null);
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

  const handleAddSubmit = async (inviteMode: 'SAVE' | 'SAVE_INVITE') => {
    setErrorMsg('');
    if (!formFirstName || !formEmail || !formPhone || !formRole) {
      setErrorMsg('First Name, Email, Phone, and Access Role are required.');
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
      } else {
        setErrorMsg(data.error || 'Failed to update user.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: active }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        await dialog.alert('Status Error', data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
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
      'Resend Invite',
      'Are you sure you want to resend the setup and password activation email to this user?'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'send_invite' }),
      });
      if (res.ok) {
        await dialog.alert('Invite Sent', 'Activation link has been successfully resent to the user!');
      } else {
        const data = await res.json();
        await dialog.alert('Error', data.error || 'Failed to resend invitation email.');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      await dialog.alert('Error', 'A network error occurred while resending invitation.');
    }
  };

  const handleSendResetLink = async (userId: string) => {
    setOpenDropdownId(null);
    const confirmed = await dialog.confirm(
      'Reset Password',
      'Are you sure you want to send a password reset link to this user via email?'
    );
    if (!confirmed) return;

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
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsers();
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const deletableIds = filteredUsers
        .filter(u => !u.isSuperAdmin && u.id !== currentUser?.id)
        .map(u => u.id);
      setSelectedUserIds(deletableIds);
    } else {
      setSelectedUserIds([]);
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

      if (res.ok) {
        setSelectedUserIds([]);
        fetchUsers();
        setActiveModal('NONE');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete selected users.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
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

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Page Header */}
      <div className={styles.searchBarContainer}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
            Users
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Invite members, assign permissions, and control rotating group profiles.
          </p>
        </div>
        
        {/* Top auxiliary buttons group to match Savvey Savers */}
        <div className={styles.topButtonsGroup}>
          <button onClick={() => setActiveModal('AGREEMENT')} className="btn btn-secondary btn-sm">
            <FileText size={14} />
            <span>Membership Agreement</span>
          </button>
          <button onClick={() => setActiveModal('SCHEDULE')} className="btn btn-secondary btn-sm">
            <CalendarRange size={14} />
            <span>Fee Schedule</span>
          </button>
          <button onClick={() => setActiveModal('REVIEWS')} className="btn btn-secondary btn-sm">
            <Star size={14} />
            <span>Reviews</span>
          </button>
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
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
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '16px' }}>
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && filteredUsers.filter(u => !u.isSuperAdmin && u.id !== currentUser?.id).every(u => selectedUserIds.includes(u.id))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ accentColor: 'var(--secondary)', cursor: 'pointer' }}
                  />
                </th>
                <th>Invitation ID</th>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
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
                          onChange={(e) => handleToggleActive(u.id, e.target.checked)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenMembershipModal(u)}
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
                          <div className={styles.dropdownMenu}>
                            <button onClick={() => handleOpenViewModal(u)} className={styles.dropdownItem}>
                              <Eye size={14} />
                              <span>View Details</span>
                            </button>
                            <button onClick={() => handleOpenEditModal(u)} className={styles.dropdownItem}>
                              <Edit size={14} />
                              <span>Edit Details</span>
                            </button>
                            {!u.membershipFeeConfirmed && u.role === 'MEMBER' && (
                              <button onClick={() => handleConfirmFee(u.id)} className={styles.dropdownItem}>
                                <CheckCircle size={14} />
                                <span>Confirm Fee</span>
                              </button>
                            )}
                             {!u.isActive ? (
                              <button onClick={() => handleResendInvite(u.id)} className={styles.dropdownItem}>
                                <Mail size={14} />
                                <span>Send Invite Link</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ADD MEMBER MODAL --- */}
      {activeModal === 'ADD' && (
        <div className="modal-overlay">
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
                  <select value={formCountry} onChange={(e) => setFormCountry(e.target.value)} className="form-select">
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: '0 0 16px 0' }}>
                <label className="form-label">Select Role *</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value as 'ADMIN' | 'MEMBER')} className="form-select">
                  <option value="MEMBER">Member (Saver)</option>
                  <option value="ADMIN">Admin (Coordinator)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddSubmit('SAVE')}
                  disabled={formSubmitting}
                  className="btn btn-secondary"
                  style={{ flex: 1.2, borderColor: 'var(--border-color)' }}
                >
                  Save Record
                </button>
                <button
                  onClick={() => handleAddSubmit('SAVE_INVITE')}
                  disabled={formSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1.5, backgroundColor: 'var(--secondary)', color: 'white' }}
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
        <div className="modal-overlay">
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
                  <select value={formCountry} onChange={(e) => setFormCountry(e.target.value)} className="form-select">
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as 'ADMIN' | 'MEMBER')}
                  disabled={selectedUser.isSuperAdmin || selectedUser.id === currentUser?.id}
                  className="form-select"
                >
                  <option value="MEMBER">Member (Saver)</option>
                  <option value="ADMIN">Admin (Coordinator)</option>
                </select>
              </div>

              {formRole === 'ADMIN' && !selectedUser?.isSuperAdmin && selectedUser.id !== currentUser?.id && (
                <div className="form-group" style={{ margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="promoteSuperAdmin"
                    checked={formIsSuperAdmin}
                    onChange={async (e) => {
                      if (e.target.checked) {
                        const confirmPromote = await dialog.confirm(
                          "Promote to Super Admin",
                          "Are you sure you want to promote this user to Super Admin? This will transfer Super Admin status to this user, and you will lose Super Admin control."
                        );
                        if (confirmPromote) {
                          setFormIsSuperAdmin(true);
                        } else {
                          // Uncheck it if cancelled
                          e.target.checked = false;
                          setFormIsSuperAdmin(false);
                        }
                      } else {
                        setFormIsSuperAdmin(false);
                      }
                    }}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--secondary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="promoteSuperAdmin" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-normal)', cursor: 'pointer' }}>
                    Promote to Super Admin (Transfers Control)
                  </label>
                </div>
              )}

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

      {/* --- VIEW DETAILS MODAL --- */}
      {activeModal === 'VIEW' && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              View Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Read-only member record configuration.
            </p>

            <div className={styles.detailGrid} style={{ gap: '16px' }}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>First Name :</span>
                <span className={styles.detailValue}>{selectedUser.firstName || selectedUser.name.split(' ')[0] || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Last Name :</span>
                <span className={styles.detailValue}>{selectedUser.lastName || selectedUser.name.split(' ').slice(1).join(' ') || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email :</span>
                <span className={styles.detailValue}>{selectedUser.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone :</span>
                <span className={styles.detailValue}>{selectedUser.phone}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Address 1 :</span>
                <span className={styles.detailValue}>{selectedUser.addressLine1 || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Address 2:</span>
                <span className={styles.detailValue}>{selectedUser.addressLine2 || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>City :</span>
                <span className={styles.detailValue}>{selectedUser.city || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Post Code :</span>
                <span className={styles.detailValue}>{selectedUser.postCode || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Country :</span>
                <span className={styles.detailValue}>{selectedUser.country || '-'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Terms & Conditions :</span>
                <span className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} style={{ color: 'var(--status-success)' }} />
                  <span>Accepted</span>
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Invitation Status :</span>
                <span className={styles.detailValue}>
                  {selectedUser.isActive ? 'Active' : 'Pending'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Role :</span>
                <span className={styles.detailValue}>{selectedUser.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
              </div>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <span className={styles.detailLabel}>Member Id :</span>
                <span className={styles.detailValue} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedUser.displayId || selectedUser.id}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary">
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {activeModal === 'DELETE_CONFIRM' && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', marginTop: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
                Delete Item
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to delete this User? This will archive their records, commitments, and cancel active cycles.
              </p>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleDeleteSubmit} disabled={formSubmitting} className="btn btn-danger" style={{ flex: 1 }}>
                {formSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM BULK DELETE CONFIRMATION MODAL --- */}
      {activeModal === 'BULK_DELETE_CONFIRM' && selectedUserIds.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', marginTop: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-family-title)' }}>
                Delete Selected Users
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to delete the {selectedUserIds.length} selected user(s)? This will archive their profiles, commitments, and cancel active cycles.
              </p>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="btn btn-danger" style={{ flex: 1 }}>
                {isBulkDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MEMBERSHIP DETAILS MODAL --- */}
      {activeModal === 'MEMBERSHIP_DETAILS' && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Memberships Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Membership payments log for {selectedUser.name}.
            </p>

            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>SR.NO.</th>
                  <th>PAYMENT YEAR</th>
                  <th>TOTAL MEMBERSHIP FEE</th>
                  <th>PAYMENT RECEIVED DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>1</td>
                  <td>{new Date(selectedUser.createdAt || Date.now()).getFullYear()}</td>
                  <td>£ 2200.00</td>
                  <td>
                    {selectedUser.membershipFeeConfirmed ? (
                      new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('en-GB')
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${selectedUser.membershipFeeConfirmed ? 'completed' : 'pending'}`}>
                      {selectedUser.membershipFeeConfirmed ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveModal('NONE')} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MEMBERSHIP AGREEMENT MODAL --- */}
      {activeModal === 'AGREEMENT' && (
        <div className="modal-overlay">
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

            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button onClick={() => setActiveModal('NONE')} style={{ position: 'absolute', right: '20px', top: '20px', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', fontFamily: 'var(--font-family-title)' }}>
              Fee Schedule
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Associated administrative charges by membership tier.
            </p>

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
        <div className="modal-overlay">
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
    </div>
  );
}
