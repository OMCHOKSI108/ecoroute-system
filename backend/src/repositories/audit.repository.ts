import { query } from '../config/db';
const ExpiryMinutes = Number(process.env.RESET_OTP_EXPIRY_MINUTES || 10);


export interface AuditLogRow {
  id: string;
  organization_id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: unknown;
  created_at: Date;
}

export interface CreateAuditLogData {
  organizationId: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}

export interface FindAuditLogsFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  page: number;
  limit: number;
}

export async function insertAuditLog(data: CreateAuditLogData): Promise<void> {
  await query(
    `INSERT INTO audit_logs (organization_id, actor_id, actor_role, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      data.organizationId,
      data.actorId ?? null,
      data.actorRole ?? null,
      data.action,
      data.entityType,
      data.entityId,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ],
  );
}

export async function findAuditLogs(
  orgId: string,
  filters: FindAuditLogsFilters,
): Promise<{ data: AuditLogRow[]; total: number }> {
  const conditions: string[] = ['organization_id = $1'];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (filters.action) {
    conditions.push(`action = $${idx++}`);
    params.push(filters.action);
  }
  if (filters.entityType) {
    conditions.push(`entity_type = $${idx++}`);
    params.push(filters.entityType);
  }
  if (filters.entityId) {
    conditions.push(`entity_id = $${idx++}`);
    params.push(filters.entityId);
  }

  const where = conditions.join(' AND ');
  const offset = (filters.page - 1) * filters.limit;

  const [dataResult, countResult] = await Promise.all([
    query<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, filters.limit, offset],
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_logs WHERE ${where}`,
      params,
    ),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0]!.count, 10),
  };
}
