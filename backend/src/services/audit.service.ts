import * as auditRepo from '../repositories/audit.repository';
import type { FindAuditLogsFilters } from '../repositories/audit.repository';
import { z } from 'zod';

export interface AuditEntry {
  organizationId: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}

export interface AuditLogResponse {
  id: string;
  organizationId: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
}

export const listAuditLogsQuerySchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

// Fire-and-forget — never throws, never blocks the caller
export function logAudit(entry: AuditEntry): void {
  auditRepo.insertAuditLog(entry).catch((err: unknown) => {
    console.error(JSON.stringify({ level: 'error', message: 'Audit log write failed', error: String(err) }));
  });
}

function toAuditResponse(row: auditRepo.AuditLogRow): AuditLogResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listAuditLogs(
  orgId: string,
  queryParams: ListAuditLogsQuery,
): Promise<{ data: AuditLogResponse[]; total: number; page: number; limit: number }> {
  const filters: FindAuditLogsFilters = {
    action: queryParams.action,
    entityType: queryParams.entityType,
    entityId: queryParams.entityId,
    page: queryParams.page,
    limit: queryParams.limit,
  };
  const { data, total } = await auditRepo.findAuditLogs(orgId, filters);
  return {
    data: data.map(toAuditResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}
