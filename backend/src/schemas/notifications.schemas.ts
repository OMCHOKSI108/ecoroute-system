import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().trim().min(1, 'Title is required').max(255),
  body: z.string().trim().optional(),
  type: z.string().trim().min(1, 'Type is required'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const listNotificationsQuerySchema = z.object({
  isRead: z.enum(['true', 'false']).optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
