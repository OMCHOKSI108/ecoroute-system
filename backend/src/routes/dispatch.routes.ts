import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { assignDispatch, dispatchPreview, autoAssign } from '../controllers/dispatch.controller';

const dispatchLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many dispatch requests, please slow down' },
});

export const dispatchRouter = Router();

dispatchRouter.use(authenticate);

dispatchRouter.post('/assign', dispatchLimiter, requireRole('admin', 'dispatcher'), assignDispatch);
dispatchRouter.post('/preview', requireRole('admin', 'dispatcher'), dispatchPreview);
dispatchRouter.post('/auto-assign', dispatchLimiter, requireRole('admin', 'dispatcher'), autoAssign);
