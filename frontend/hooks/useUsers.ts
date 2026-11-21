'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { User } from '@/lib/types';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'business_user';
  phone?: string;
  businessId?: string;
  vehicleId?: string;
  driverStatus?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'admin' | 'dispatcher' | 'driver' | 'business_user';
  phone?: string | null;
  businessId?: string | null;
  vehicleId?: string | null;
  driverStatus?: string | null;
  isActive?: boolean;
  password?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ecoroute_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (roleFilter) params.append('role', roleFilter);

      const res = await apiGet<{ data?: User[]; pagination?: { total: number } } | User[]>(
        `/users?${params.toString()}`,
      );

      let list: User[] = [];
      let totalCount = 0;

      if (Array.isArray(res)) {
        list = res;
        totalCount = res.length;
      } else if (res && typeof res === 'object') {
        list = (res as any).data || [];
        totalCount = (res as any).pagination?.total || (res as any).total || list.length;
      }

      setUsers(list);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: CreateUserData): Promise<User> => {
    const res = await apiPost<any>('/users', data);
    const created: User = res.data || res.user || res;
    await fetchUsers();
    return created;
  };

  const updateUser = async (id: string, data: UpdateUserData): Promise<User> => {
    const res = await apiPatch<any>(`/users/${id}`, data);
    const updated: User = res.data || res.user || res;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    return updated;
  };

  const updateUserRole = async (id: string, role: string, businessId?: string | null): Promise<User> => {
    const res = await apiPatch<any>(`/users/${id}/role`, { role, businessId });
    const updated: User = res.data || res.user || res;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    return updated;
  };

  const updateUserStatus = async (id: string, isActive: boolean): Promise<User> => {
    const res = await apiPatch<any>(`/users/${id}/status`, { isActive });
    const updated: User = res.data || res.user || res;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated, isActive } : u)));
    return updated;
  };

  const deleteUser = async (id: string): Promise<void> => {
    await apiDelete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  return {
    users,
    loading,
    error,
    total,
    page,
    setPage,
    roleFilter,
    setRoleFilter,
    fetchUsers,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
  };
}
