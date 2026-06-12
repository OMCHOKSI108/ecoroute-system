import * as notifRepo from '../repositories/notifications.repository';
import { NotFoundError } from '../types/errors';
import type {
  ListNotificationsQuery,
  CreateNotificationInput,
} from '../schemas/notifications.schemas';
import type { NotificationRow } from '../repositories/notifications.repository';

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  metadata: unknown;
  createdAt: string;
}

function toResponse(row: NotificationRow): NotificationResponse {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    isRead: row.is_read,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  orgId: string,
  queryParams: ListNotificationsQuery,
): Promise<{ data: NotificationResponse[]; total: number; page: number; limit: number }> {
  const isRead = queryParams.isRead === undefined ? undefined : queryParams.isRead === 'true';
  const { data, total } = await notifRepo.findNotifications(userId, orgId, {
    isRead,
    type: queryParams.type,
    page: queryParams.page,
    limit: queryParams.limit,
  });
  return {
    data: data.map(toResponse),
    total,
    page: queryParams.page,
    limit: queryParams.limit,
  };
}

export async function getUnreadCount(userId: string, orgId: string): Promise<{ count: number }> {
  const count = await notifRepo.getUnreadCount(userId, orgId);
  return { count };
}

export async function markAsRead(
  id: string,
  userId: string,
  orgId: string,
): Promise<NotificationResponse> {
  const row = await notifRepo.markAsRead(id, userId, orgId);
  if (!row) throw new NotFoundError('Notification not found');
  return toResponse(row);
}

export async function markAllAsRead(
  userId: string,
  orgId: string,
): Promise<{ updatedCount: number }> {
  const count = await notifRepo.markAllAsRead(userId, orgId);
  return { updatedCount: count };
}

export async function createNotification(
  orgId: string,
  input: CreateNotificationInput,
): Promise<NotificationResponse> {
  const row = await notifRepo.createNotification(
    input.userId,
    orgId,
    input.title,
    input.type,
    input.body,
    input.metadata,
  );
  return toResponse(row);
}
