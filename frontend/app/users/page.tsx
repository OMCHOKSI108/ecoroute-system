'use client';

import { useState } from 'react';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUsers, CreateUserData, UpdateUserData } from '@/hooks/useUsers';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useVehicles } from '@/hooks/useVehicles';
import type { User } from '@/lib/types';

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    roleFilter,
    setRoleFilter,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
  } = useUsers();

  const { businesses } = useBusinesses();
  const { vehicles } = useVehicles();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState<CreateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'dispatcher',
    phone: '',
    businessId: '',
    vehicleId: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<UpdateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'dispatcher',
    phone: '',
    businessId: '',
    vehicleId: '',
    driverStatus: 'available',
    isActive: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setAddForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'dispatcher',
      phone: '',
      businessId: businesses[0]?.id || '',
      vehicleId: '',
    });
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      businessId: user.businessId || (businesses[0]?.id ?? ''),
      vehicleId: '',
      driverStatus: user.driverStatus || 'available',
      isActive: user.isActive !== false,
    });
    setModalError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      if (addForm.role === 'business_user' && !addForm.businessId) {
        throw new Error('Please select a commercial business for the business user');
      }

      await createUser({
        ...addForm,
        businessId: addForm.role === 'business_user' ? addForm.businessId : undefined,
        vehicleId: addForm.role === 'driver' && addForm.vehicleId ? addForm.vehicleId : undefined,
      });

      setIsAddModalOpen(false);
      showToast(`User ${addForm.firstName} ${addForm.lastName} created successfully!`);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setModalError(null);

    try {
      if (editForm.role === 'business_user' && !editForm.businessId) {
        throw new Error('Please select a business for the business user');
      }

      await updateUser(editingUser.id, {
        ...editForm,
        businessId: editForm.role === 'business_user' ? editForm.businessId : null,
      });

      setEditingUser(null);
      showToast(`User ${editingUser.name} updated successfully!`);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRoleChange = async (user: User, newRole: any) => {
    try {
      let bId: string | null = null;
      if (newRole === 'business_user') {
        bId = user.businessId || businesses[0]?.id || null;
      }
      await updateUserRole(user.id, newRole, bId);
      showToast(`Updated ${user.name}'s role to ${newRole}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const nextState = !(user.isActive !== false);
      await updateUserStatus(user.id, nextState);
      showToast(`User ${user.name} is now ${nextState ? 'Active' : 'Deactivated'}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to remove ${user.name} (${user.email})?`)) return;
    try {
      await deleteUser(user.id);
      showToast(`User ${user.name} removed successfully.`);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    }
  };

  return (
    <ProtectedAppPage allowedRoles={['admin']}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <PageHeader
            title="Team & User Management"
            description="Manage organizational roles, permissions, drivers, and commercial business accounts."
          />
        </div>
        <Button onClick={handleOpenAdd} data-testid="add-user-button">
          + Add Team Member
        </Button>
      </div>

      {toastMessage && (
        <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-800 animate-fade-in flex items-center justify-between">
          <span>✅ {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { label: 'All Users', val: '' },
          { label: 'Admins', val: 'admin' },
          { label: 'Dispatchers', val: 'dispatcher' },
          { label: 'Drivers', val: 'driver' },
          { label: 'Business Clients', val: 'business_user' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setRoleFilter(tab.val)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              roleFilter === tab.val
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid={`filter-${tab.val || 'all'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState message="Loading team members..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && users.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <EmptyState
            title="No users found"
            description="Create your first team member or adjust the role filter."
          />
          <Button onClick={handleOpenAdd} className="mt-4">
            + Add Team Member
          </Button>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm" data-testid="users-table">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role & Permissions</th>
                <th className="px-6 py-3.5">Linked Context</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {users.map((u) => {
                const isActive = u.isActive !== false;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors" data-testid={`user-row-${u.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase">
                          {(u.name || u.email).substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                          {u.phone && <div className="text-xs text-gray-400">📞 {u.phone}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleQuickRoleChange(u, e.target.value)}
                          className={`rounded-md border text-xs font-semibold py-1 px-2.5 outline-none cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'dispatcher'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : u.role === 'driver'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                          title="Change user role directly"
                          data-testid={`role-select-${u.id}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="dispatcher">Dispatcher</option>
                          <option value="driver">Driver</option>
                          <option value="business_user">Business Client</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {u.role === 'business_user' && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-800">
                            🏢 {u.businessName || 'Linked Business'}
                          </span>
                        </div>
                      )}
                      {u.role === 'driver' && (
                        <div className="text-xs flex items-center gap-1.5">
                          <span className="text-gray-500">Driver status:</span>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                            {u.driverStatus || 'available'}
                          </span>
                        </div>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-xs text-gray-400">Full Org Access</span>
                      )}
                      {u.role === 'dispatcher' && (
                        <span className="text-xs text-gray-400">Fleet & Routing</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                        data-testid={`status-toggle-${u.id}`}
                      >
                        {isActive ? '● Active' : '○ Inactive'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="rounded p-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
                          data-testid={`edit-user-${u.id}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="rounded p-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                          data-testid={`delete-user-${u.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="add-user-modal">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">Provision New Team Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            {modalError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs text-red-700">{modalError}</div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Jane"
                    data-testid="input-firstname"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Doe"
                    data-testid="input-lastname"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="jane@ecoroute.demo"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Min 8 characters"
                    data-testid="input-password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assign Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    data-testid="select-role"
                  >
                    <option value="dispatcher">Dispatcher</option>
                    <option value="driver">Driver</option>
                    <option value="business_user">Business Client</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="+1 555-0199"
                  />
                </div>
              </div>

              {/* Dynamic Context Fields */}
              {addForm.role === 'business_user' && (
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Linked Commercial Business *
                  </label>
                  <select
                    required
                    value={addForm.businessId}
                    onChange={(e) => setAddForm({ ...addForm, businessId: e.target.value })}
                    className="w-full rounded-md border border-amber-300 bg-white p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    data-testid="select-business"
                  >
                    <option value="">Select a commercial business...</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.address})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-amber-700">
                    Business users are strictly bound to their location and can only view/create pickups for this facility.
                  </p>
                </div>
              )}

              {addForm.role === 'driver' && (
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    Assign Fleet Vehicle (Optional)
                  </label>
                  <select
                    value={addForm.vehicleId}
                    onChange={(e) => setAddForm({ ...addForm, vehicleId: e.target.value })}
                    className="w-full rounded-md border border-emerald-300 bg-white p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    data-testid="select-vehicle"
                  >
                    <option value="">No vehicle assigned yet</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.type} ({v.capacityKg} kg capacity)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} data-testid="submit-user-button">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">Edit User & Role Permissions</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            {modalError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs text-red-700">{modalError}</div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role & Permissions *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none font-semibold text-gray-800"
                    data-testid="edit-role-select"
                  >
                    <option value="admin">Administrator</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="driver">Driver</option>
                    <option value="business_user">Business Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {editForm.role === 'business_user' && (
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Linked Business Location *
                  </label>
                  <select
                    required
                    value={editForm.businessId || ''}
                    onChange={(e) => setEditForm({ ...editForm, businessId: e.target.value })}
                    className="w-full rounded-md border border-amber-300 bg-white p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select a commercial business...</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.address})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editForm.role === 'driver' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Driver Status</label>
                    <select
                      value={editForm.driverStatus || 'available'}
                      onChange={(e) => setEditForm({ ...editForm, driverStatus: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="on_route">On Route</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assign Vehicle</label>
                    <select
                      value={editForm.vehicleId || ''}
                      onChange={(e) => setEditForm({ ...editForm, vehicleId: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">No vehicle assigned</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plateNumber} ({v.capacityKg} kg)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="New password (optional)"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} data-testid="save-user-button">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
