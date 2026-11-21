'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AuditLog[]>('/audit-logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <ProtectedAppPage allowedRoles={['admin']}>
      <PageHeader title="Audit Logs" description="Immutable system-wide audit trail and security compliance records" />

      {loading && <LoadingState message="Loading audit trail…" />}
      {error && <ErrorState message={error} onRetry={loadLogs} />}

      {!loading && !error && logs.length === 0 && (
        <EmptyState title="No audit logs" description="Audit events will appear here as system actions occur." />
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white" data-testid="audit-logs-table">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Entity Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Entity ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((l) => (
                <tr key={l.id} data-testid={`audit-row-${l.id}`}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{l.action}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{l.entityType}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{l.entityId || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProtectedAppPage>
  );
}
