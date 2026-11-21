'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

interface ProtectedAppPageProps {
  children: ReactNode;
  allowedRoles?: string[];
}

/**
 * Wraps a page with authentication check + AppShell layout.
 * Use this on every protected page to avoid repeating the pattern.
 */
export function ProtectedAppPage({ children, allowedRoles }: ProtectedAppPageProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
