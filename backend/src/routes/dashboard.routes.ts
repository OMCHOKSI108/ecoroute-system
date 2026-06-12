import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  getDashboardSummary,
  getVehicleWorkloads,
  getPickupStats,
  getTrends,
  getDriverActivity,
} from '../controllers/dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/summary', requireRole('admin', 'dispatcher'), getDashboardSummary);
dashboardRouter.get('/vehicles', requireRole('admin', 'dispatcher'), getVehicleWorkloads);
dashboardRouter.get('/pickups', requireRole('admin', 'dispatcher'), getPickupStats);
dashboardRouter.get('/trends', requireRole('admin', 'dispatcher'), getTrends);
dashboardRouter.get('/drivers', requireRole('admin', 'dispatcher'), getDriverActivity);
