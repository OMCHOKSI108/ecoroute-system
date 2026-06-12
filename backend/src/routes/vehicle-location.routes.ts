import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  reportLocation,
  getLatestLocation,
  getAllLatestLocations,
  getLocationHistory,
} from '../controllers/vehicle-location.controller';

export const vehicleLocationRouter = Router();

vehicleLocationRouter.use(authenticate);

vehicleLocationRouter.get('/', requireRole('admin', 'dispatcher'), getAllLatestLocations);
vehicleLocationRouter.post('/:vehicleId', requireRole('admin', 'dispatcher', 'driver'), reportLocation);
vehicleLocationRouter.get('/:vehicleId/latest', requireRole('admin', 'dispatcher', 'driver'), getLatestLocation);
vehicleLocationRouter.get('/:vehicleId/history', requireRole('admin', 'dispatcher'), getLocationHistory);
