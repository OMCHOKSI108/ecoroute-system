import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  createOrganization,
  listOrganizations,
  getOrganizationById,
  updateOrganization,
} from '../controllers/organizations.controller';

export const organizationsRouter = Router();

organizationsRouter.use(authenticate);

organizationsRouter.get('/', requireRole('admin'), listOrganizations);
organizationsRouter.post('/', requireRole('admin'), createOrganization);
organizationsRouter.get('/:id', requireRole('admin'), getOrganizationById);
organizationsRouter.patch('/:id', requireRole('admin'), updateOrganization);
