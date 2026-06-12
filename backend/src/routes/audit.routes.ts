import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { listAuditLogs } from '../controllers/audit.controller';

export const auditRouter = Router();

auditRouter.use(authenticate);

auditRouter.get('/', requireRole('admin'), listAuditLogs);
