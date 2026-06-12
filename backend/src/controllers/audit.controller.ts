import { Request, Response } from 'express';
import { z } from 'zod';
import * as auditService from '../services/audit.service';
import { ValidationError } from '../types/errors';
import { sendPaginated } from '../utils/response';

function parseQuery<T>(schema: z.ZodSchema<T>, q: unknown): T {
  const result = schema.safeParse(q);
  if (!result.success) throw new ValidationError('Invalid query parameters', result.error.issues);
  return result.data;
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(auditService.listAuditLogsQuerySchema, req.query);
  const { data, total, page, limit } = await auditService.listAuditLogs(orgId, query);
  sendPaginated(res, data, total, page, limit);
}
