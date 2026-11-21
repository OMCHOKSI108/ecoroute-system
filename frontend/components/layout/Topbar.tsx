'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const title = segment.replace(/-/g, ' ');

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { logout, user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-lg font-semibold capitalize text-gray-900">{title}</h2>

      <div className="flex items-center gap-4">
        {/* User Info */}
        {user && (
          <span className="text-xs text-gray-500 hidden sm:inline" data-testid="topbar-user-email">
            {user.email} ({user.role})
          </span>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none"
            data-testid="notification-bell"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
                data-testid="unread-notification-badge"
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50"
              data-testid="notification-dropdown"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    data-testid="mark-all-read-button"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-400">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                        !n.read ? 'bg-blue-50/50' : ''
                      }`}
                      data-testid={`notification-item-${n.id}`}
                    >
                      <p className="font-semibold text-gray-900">{n.title}</p>
                      <p className="text-gray-600 mt-0.5">{n.message}</p>
                      {!n.read && (
                        <span className="inline-block mt-1 text-[10px] text-blue-600 font-medium">
                          ● Unread
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          data-testid="logout-button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
