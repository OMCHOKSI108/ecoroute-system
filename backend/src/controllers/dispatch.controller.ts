import { Request, Response } from 'express';
import { z } from 'zod';
import { assignDispatchSchema, dispatchPreviewSchema, autoAssignSchema } from '../schemas/dispatch.schemas';
import * as dispatchService from '../services/dispatch.service';
import { ValidationError } from '../types/errors';
import { sendSuccess } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Validation failed', result.error.issues);
  return result.data;
}

export async function assignDispatch(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(assignDispatchSchema, req.body);
  sendSuccess(res, await dispatchService.assignDispatch(input, orgId, req.user!.sub, req.user!.role));
}

export async function dispatchPreview(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(dispatchPreviewSchema, req.body);
  sendSuccess(res, await dispatchService.dispatchPreview(input, orgId));
}

export async function autoAssign(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(autoAssignSchema, req.body);
  sendSuccess(res, await dispatchService.autoAssign(input, orgId, req.user!.sub, req.user!.role));
}
