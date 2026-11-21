import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  getMe,
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/me', getMe);
usersRouter.get('/', requireRole('admin'), listUsers);
usersRouter.post('/', requireRole('admin'), createUser);
usersRouter.get('/:id', requireRole('admin'), getUserById);
usersRouter.patch('/:id', requireRole('admin'), updateUser);
usersRouter.delete('/:id', requireRole('admin'), deleteUser);
usersRouter.patch('/:id/role', requireRole('admin'), updateUserRole);
usersRouter.patch('/:id/status', requireRole('admin'), updateUserStatus);
