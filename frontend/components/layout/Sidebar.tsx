'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { APP_NAME } from '@/lib/constants';

interface NavItem {
  label: string;
  href: string;
  roles: Array<'admin' | 'dispatcher' | 'driver' | 'business_user'>;
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, roles: ['admin'] },
  { label: 'Dispatch', href: ROUTES.DISPATCH, roles: ['admin', 'dispatcher'] },
  { label: 'Live Tracking', href: ROUTES.LIVE_TRACKING, roles: ['admin', 'dispatcher'] },
  { label: 'Pickups', href: ROUTES.PICKUPS, roles: ['admin', 'dispatcher', 'driver', 'business_user'] },
  { label: 'Routes', href: ROUTES.ROUTES, roles: ['admin', 'dispatcher', 'driver'] },
  { label: 'Drivers', href: ROUTES.DRIVERS, roles: ['admin', 'dispatcher'] },
  { label: 'Vehicles', href: ROUTES.VEHICLES, roles: ['admin', 'dispatcher'] },
  { label: 'Businesses', href: ROUTES.BUSINESSES, roles: ['admin', 'dispatcher'] },
  { label: 'Team / Users', href: ROUTES.USERS, roles: ['admin'] },
  { label: 'Pickup Locations', href: ROUTES.PICKUP_LOCATIONS, roles: ['admin', 'dispatcher', 'business_user'] },
  { label: 'Waste Categories', href: ROUTES.WASTE_CATEGORIES, roles: ['admin', 'dispatcher'] },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, roles: ['admin', 'dispatcher', 'driver', 'business_user'] },
  { label: 'Audit Logs', href: ROUTES.AUDIT_LOGS, roles: ['admin'] },
  { label: 'Organizations', href: ROUTES.ORGANIZATIONS, roles: ['admin'] },
  { label: 'Settings', href: ROUTES.SETTINGS, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || 'dispatcher';

  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 flex-shrink-0 overflow-y-auto bg-slate-900 text-slate-100 flex flex-col justify-between">
      <div>
        <div className="flex h-16 items-center px-6 text-base font-bold text-emerald-400">
          🌱 {APP_NAME}
        </div>
        <nav className="px-3 pb-6">
          {visibleItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mt-1 flex rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {user && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="text-xs text-slate-400">Signed in as</div>
          <div className="text-sm font-semibold text-slate-200 truncate">{user.name || user.email}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {user.role}
            </span>
            {user.businessName && (
              <span className="text-[11px] text-slate-400 truncate max-w-[130px]" title={user.businessName}>
                📍 {user.businessName}
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
