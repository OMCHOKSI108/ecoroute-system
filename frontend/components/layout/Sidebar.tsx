'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { APP_NAME } from '@/lib/constants';

const navItems = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Dispatch', href: ROUTES.DISPATCH },
  { label: 'Live Tracking', href: ROUTES.LIVE_TRACKING },
  { label: 'Pickups', href: ROUTES.PICKUPS },
  { label: 'Routes', href: ROUTES.ROUTES },
  { label: 'Drivers', href: ROUTES.DRIVERS },
  { label: 'Vehicles', href: ROUTES.VEHICLES },
  { label: 'Organizations', href: ROUTES.ORGANIZATIONS },
  { label: 'Businesses', href: ROUTES.BUSINESSES },
  { label: 'Users', href: ROUTES.USERS },
  { label: 'Waste Categories', href: ROUTES.WASTE_CATEGORIES },
  { label: 'Pickup Locations', href: ROUTES.PICKUP_LOCATIONS },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  { label: 'Audit Logs', href: ROUTES.AUDIT_LOGS },
  { label: 'Settings', href: ROUTES.SETTINGS },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 flex-shrink-0 overflow-y-auto bg-slate-900 text-slate-100">
      <div className="flex h-16 items-center px-6 text-base font-bold text-emerald-400">
        {APP_NAME}
      </div>
      <nav className="px-3 pb-6">
        {navItems.map((item) => {
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
    </aside>
  );
}
