import { Request, Response } from 'express';
import { z } from 'zod';
import {
  generateRouteSchema,
  updateRouteStatusSchema,
  listRoutesQuerySchema,
} from '../schemas/routes.schemas';
import * as routesService from '../services/routes.service';
import { ValidationError } from '../types/errors';
import { sendSuccess, sendPaginated } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Validation failed', result.error.issues);
  return result.data;
}

function parseQuery<T>(schema: z.ZodSchema<T>, q: unknown): T {
  const result = schema.safeParse(q);
  if (!result.success) throw new ValidationError('Invalid query parameters', result.error.issues);
  return result.data;
}

export async function generateRoute(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(generateRouteSchema, req.body);
  sendSuccess(res, await routesService.generateRoute(input, orgId, req.user!.sub, req.user!.role), 201);
}

export async function listRoutes(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(listRoutesQuerySchema, req.query);
  const { data, total, page, limit } = await routesService.listRoutes(orgId, query);
  sendPaginated(res, data, total, page, limit);
}

export async function getRouteById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await routesService.getRouteById(id, orgId));
}

export async function updateRouteStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateRouteStatusSchema, req.body);
  sendSuccess(res, await routesService.completeRoute(id, orgId, req.user!.sub, req.user!.role));
  void input; // validated — only 'completed' is accepted
}
