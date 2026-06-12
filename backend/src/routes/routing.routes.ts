import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import {
  routeBetween,
  nearestRoad,
  distanceMatrix,
  tripOptimize,
} from '../controllers/routing.controller';

const routingLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many routing requests, please slow down' },
});

export const routingRouter = Router();

routingRouter.use(authenticate);
routingRouter.use(requireRole('admin', 'dispatcher', 'driver'));

routingRouter.post('/route', routingLimiter, routeBetween);
routingRouter.post('/nearest', routingLimiter, nearestRoad);
routingRouter.post('/matrix', routingLimiter, distanceMatrix);
routingRouter.post('/trip', routingLimiter, tripOptimize);
