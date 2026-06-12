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

export async function findUserByEmail(email:string){
  await query(`SELECT * FROM users WHERE email = $1`, [email]);
}

export async function createPasswordResetOtp(userId: string, otp: string, expiryMinutes: number): Promise<void> {

  
  await query(
    `INSERT INTO password_reset_otps (user_id, otp) VALUES ($1, $2)`,
    [userId, otp]
  );
}



export async function findLatestValidResetOtp(userId: string) {
  await query(
    `SELECT * FROM password_reset_otps
     WHERE user_id = $1 AND used_at IS NULL AND created_at >= NOW() - INTERVAL '${ExpiryMinutes} minutes'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

}

export async function incrementResetOtpAttempts(id: string) {
  await query(
    `UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1`,
    [id]
  );
}

export async function markResetOtpUsed(id: string) {
  await query(
    `UPDATE password_reset_otps SET used_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, userId]
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
