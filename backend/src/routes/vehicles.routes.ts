import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  createVehicle,
  listVehicles,
  getVehicleById,
  updateVehicleStatus,
  assignDriver,
} from '../controllers/vehicles.controller';

export const vehiclesRouter = Router();

vehiclesRouter.use(authenticate);

vehiclesRouter.post('/', requireRole('admin'), createVehicle);
vehiclesRouter.get('/', requireRole('admin', 'dispatcher'), listVehicles);
vehiclesRouter.get('/:id', requireRole('admin', 'dispatcher'), getVehicleById);
vehiclesRouter.patch('/:id/status', requireRole('admin', 'dispatcher'), updateVehicleStatus);
vehiclesRouter.post('/:id/driver', requireRole('admin'), assignDriver);
