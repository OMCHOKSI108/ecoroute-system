'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { formatDateTime } from '@/lib/utils';

export function NotificationDropdown() {
  const { notifications, loading } = useNotifications();
  return (
    <div className="w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
        Notifications
      </div>
      {loading ? (
        <div className="p-4 text-sm text-gray-500">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">No notifications</div>
      ) : (
        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id} className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
              <p className="text-sm font-medium text-gray-900">{n.title}</p>
              <p className="text-xs text-gray-500">{n.message}</p>
              <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
