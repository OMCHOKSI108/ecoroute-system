'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const title = segment.replace(/-/g, ' ');

  const { logout, user } = useAuth();

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
