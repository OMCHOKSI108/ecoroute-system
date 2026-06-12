import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  generateRoute,
  listRoutes,
  getRouteById,
  updateRouteStatus,
} from '../controllers/routes.controller';

export const routesRouter = Router();

routesRouter.use(authenticate);

routesRouter.post('/generate', requireRole('admin', 'dispatcher'), generateRoute);
routesRouter.get('/', requireRole('admin', 'dispatcher'), listRoutes);
routesRouter.get('/:id', requireRole('admin', 'dispatcher'), getRouteById);
routesRouter.patch('/:id/status', requireRole('admin', 'dispatcher'), updateRouteStatus);
