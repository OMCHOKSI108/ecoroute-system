import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  getMe,
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
} from '../controllers/users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/me', getMe);
usersRouter.get('/', requireRole('admin'), listUsers);
usersRouter.get('/:id', requireRole('admin'), getUserById);
usersRouter.patch('/:id/role', requireRole('admin'), updateUserRole);
usersRouter.patch('/:id/status', requireRole('admin'), updateUserStatus);
