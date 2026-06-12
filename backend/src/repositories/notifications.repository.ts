import { query } from '../config/db';

export interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  metadata: unknown;
  created_at: Date;
}

export interface FindNotificationsOpts {
  isRead?: boolean;
  type?: string;
  page: number;
  limit: number;
}

export async function findNotifications(
  userId: string,
  orgId: string,
  opts: FindNotificationsOpts,
): Promise<{ data: NotificationRow[]; total: number }> {
  const conditions: string[] = ['user_id = $1', 'organization_id = $2'];
  const params: unknown[] = [userId, orgId];
  let idx = 3;

  if (opts.isRead !== undefined) {
    conditions.push(`is_read = $${idx++}`);
    params.push(opts.isRead);
  }
  if (opts.type) {
    conditions.push(`type = $${idx++}`);
    params.push(opts.type);
  }

  const where = conditions.join(' AND ');
  const offset = (opts.page - 1) * opts.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM notifications WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const dataResult = await query<NotificationRow>(
    `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, opts.limit, offset],
  );

  return { data: dataResult.rows, total };
}

export async function findNotificationById(
  id: string,
  userId: string,
  orgId: string,
): Promise<NotificationRow | null> {
  const result = await query<NotificationRow>(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2 AND organization_id = $3',
    [id, userId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function markAsRead(
  id: string,
  userId: string,
  orgId: string,
): Promise<NotificationRow | null> {
  const result = await query<NotificationRow>(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 AND organization_id = $3 RETURNING *`,
    [id, userId, orgId],
  );
  return result.rows[0] ?? null;
}

export async function markAllAsRead(userId: string, orgId: string): Promise<number> {
  const result = await query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND organization_id = $2 AND is_read = false`,
    [userId, orgId],
  );
  return result.rowCount ?? 0;
}

export async function getUnreadCount(userId: string, orgId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND organization_id = $2 AND is_read = false`,
    [userId, orgId],
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

export async function createNotification(
  userId: string,
  orgId: string,
  title: string,
  type: string,
  body?: string,
  metadata?: unknown,
): Promise<NotificationRow> {
  const result = await query<NotificationRow>(
    `INSERT INTO notifications (organization_id, user_id, title, body, type, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [orgId, userId, title, body ?? null, type, metadata ?? null],
  );
  return result.rows[0]!;
}
