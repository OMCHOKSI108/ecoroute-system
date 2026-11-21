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

pickupsRouter.post('/', requireRole('admin', 'dispatcher', 'business_user'), createPickup);
pickupsRouter.get('/', requireRole('admin', 'dispatcher', 'business_user'), listPickups);
// /my and /nearby must be registered before /:id — Express matches routes in declaration order
pickupsRouter.get('/my', requireRole('driver', 'business_user'), getMyPickups);
pickupsRouter.get('/nearby', requireRole('admin', 'dispatcher'), getNearbyPickups);
pickupsRouter.get('/:id', requireRole('admin', 'dispatcher', 'driver', 'business_user'), getPickupById);
pickupsRouter.patch('/:id/status', requireRole('admin', 'dispatcher', 'driver'), updatePickupStatus);
pickupsRouter.post('/:id/cancel', requireRole('admin', 'dispatcher', 'business_user'), cancelPickup);
