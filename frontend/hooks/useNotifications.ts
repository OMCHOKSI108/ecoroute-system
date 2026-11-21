'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  body?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nData, cData] = await Promise.all([
        api.get<NotificationItem[]>('/notifications'),
        api.get<{ count: number }>('/notifications/unread-count').catch(() => ({ count: 0 })),
      ]);
      const list = Array.isArray(nData) ? nData : [];
      setNotifications(
        list.map((n) => ({
          ...n,
          message: n.body || n.message || '',
          read: n.isRead ?? n.read ?? false,
        })),
      );
      setUnreadCount(cData?.count ?? list.filter((n) => !(n.isRead ?? n.read)).length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n)),
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    reload: loadNotifications,
  };
}
