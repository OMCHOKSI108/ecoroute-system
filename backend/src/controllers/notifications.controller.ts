import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
} from '../schemas/notifications.schemas';
import * as notifService from '../services/notifications.service';
import { ValidationError } from '../types/errors';
import { sendSuccess, sendPaginated } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Validation failed', result.error.issues);
  return result.data;
}

function parseQuery<T>(schema: z.ZodSchema<T>, q: unknown): T {
  const result = schema.safeParse(q);
  if (!result.success) throw new ValidationError('Invalid query parameters', result.error.issues);
  return result.data;
}

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const { sub: userId, orgId } = req.user!;
  const query = parseQuery(listNotificationsQuerySchema, req.query);
  const { data, total, page, limit } = await notifService.listNotifications(userId, orgId, query);
  sendPaginated(res, data, total, page, limit);
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  const { sub: userId, orgId } = req.user!;
  sendSuccess(res, await notifService.getUnreadCount(userId, orgId));
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const { sub: userId, orgId } = req.user!;
  const id = req.params['id'] as string;
  sendSuccess(res, await notifService.markAsRead(id, userId, orgId));
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const { sub: userId, orgId } = req.user!;
  sendSuccess(res, await notifService.markAllAsRead(userId, orgId));
}

export async function createNotification(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(createNotificationSchema, req.body);
  sendSuccess(res, await notifService.createNotification(orgId, input), 201);
}
