import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
} from '../controllers/notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', listNotifications);
notificationsRouter.get('/unread-count', getUnreadCount);
notificationsRouter.post('/', requireRole('admin', 'dispatcher'), createNotification);
notificationsRouter.patch('/read-all', markAllAsRead);
notificationsRouter.patch('/:id/read', markAsRead);
