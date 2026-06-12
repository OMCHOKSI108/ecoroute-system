import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  createBusiness,
  listBusinesses,
  getBusinessById,
} from '../controllers/businesses.controller';
import {
  createPickupLocation,
  listPickupLocations,
} from '../controllers/pickup-locations.controller';

export const businessesRouter = Router();

businessesRouter.use(authenticate);

businessesRouter.post('/', requireRole('admin', 'dispatcher'), createBusiness);
businessesRouter.get('/', requireRole('admin', 'dispatcher'), listBusinesses);
businessesRouter.get('/:id', requireRole('admin', 'dispatcher'), getBusinessById);

// Nested pickup-location sub-resources
businessesRouter.post('/:id/locations', requireRole('admin', 'dispatcher'), createPickupLocation);
businessesRouter.get('/:id/locations', requireRole('admin', 'dispatcher'), listPickupLocations);
