'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, extractUser } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { ROUTES, getRoleLandingPage } from '@/lib/routes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`${ROUTES.LOGIN}?returnUrl=${returnUrl}`);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      apiGet<Record<string, unknown>>('/users/me')
        .then((res) => {
          const u = extractUser(res);
          const role = u?.role || (res as any)?.role;
          setUserRole(role);
          if (role && allowedRoles.includes(role)) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
          setChecking(false);
        })
        .catch(() => {
          setAuthorized(false);
          setChecking(false);
        });
    } else {
      setAuthorized(true);
      setChecking(false);
    }
  }, [router, pathname, allowedRoles]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Checking authentication & permissions…</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center" data-testid="unauthorized-message">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Your role (<span className="font-semibold text-gray-800">{userRole || 'current user'}</span>) does not have sufficient permissions to view this section.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push(getRoleLandingPage(userRole || undefined))}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            data-testid="return-dashboard-button"
          >
            Return to My Workspace
          </button>
          <button
            onClick={() => {
              const { clearToken } = require('@/lib/auth');
              clearToken();
              router.push(ROUTES.LOGIN);
            }}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            data-testid="logout-button"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
