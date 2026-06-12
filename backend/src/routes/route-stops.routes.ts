import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  listRouteStops,
  getRouteStopById,
  updateRouteStopStatus,
  getRouteStopsByRouteId,
} from '../controllers/route-stops.controller';

export const routeStopsRouter = Router();

routeStopsRouter.use(authenticate);

routeStopsRouter.get('/', requireRole('admin', 'dispatcher'), listRouteStops);
routeStopsRouter.get('/by-route/:routeId', requireRole('admin', 'dispatcher', 'driver'), getRouteStopsByRouteId);
routeStopsRouter.get('/:id', requireRole('admin', 'dispatcher', 'driver'), getRouteStopById);
routeStopsRouter.patch('/:id/status', requireRole('admin', 'dispatcher'), updateRouteStopStatus);
