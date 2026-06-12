import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  createPickup,
  listPickups,
  getPickupById,
  updatePickupStatus,
  getMyPickups,
  getNearbyPickups,
  cancelPickup,
} from '../controllers/pickups.controller';

export const pickupsRouter = Router();

pickupsRouter.use(authenticate);

pickupsRouter.post('/', requireRole('admin', 'dispatcher'), createPickup);
pickupsRouter.get('/', requireRole('admin', 'dispatcher'), listPickups);
// /my and /nearby must be registered before /:id — Express matches routes in declaration order
pickupsRouter.get('/my', requireRole('driver'), getMyPickups);
pickupsRouter.get('/nearby', requireRole('admin', 'dispatcher'), getNearbyPickups);
pickupsRouter.get('/:id', requireRole('admin', 'dispatcher'), getPickupById);
pickupsRouter.patch('/:id/status', requireRole('admin', 'dispatcher'), updatePickupStatus);
pickupsRouter.post('/:id/cancel', requireRole('admin', 'dispatcher', 'business_user'), cancelPickup);
