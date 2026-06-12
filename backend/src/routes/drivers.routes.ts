import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  listDrivers,
  getDriverById,
  updateDriverStatus,
  assignVehicle,
  unassignVehicle,
} from '../controllers/drivers.controller';

export const driversRouter = Router();

driversRouter.use(authenticate);

driversRouter.get('/', requireRole('admin', 'dispatcher'), listDrivers);
driversRouter.get('/:id', requireRole('admin', 'dispatcher'), getDriverById);
driversRouter.patch('/:id/status', requireRole('admin', 'dispatcher'), updateDriverStatus);
driversRouter.post('/:id/vehicle/:vehicleId', requireRole('admin', 'dispatcher'), assignVehicle);
driversRouter.delete('/:id/vehicle/:vehicleId', requireRole('admin', 'dispatcher'), unassignVehicle);
