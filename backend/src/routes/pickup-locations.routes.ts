import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  listAllPickupLocations,
  getPickupLocationById,
  updatePickupLocation,
  deletePickupLocation,
} from '../controllers/pickup-locations.controller';

export const pickupLocationsRouter = Router();

pickupLocationsRouter.use(authenticate);
pickupLocationsRouter.use(requireRole('admin', 'dispatcher'));

pickupLocationsRouter.get('/', listAllPickupLocations);
pickupLocationsRouter.get('/:id', getPickupLocationById);
pickupLocationsRouter.patch('/:id', updatePickupLocation);
pickupLocationsRouter.delete('/:id', deletePickupLocation);

