import { Request, Response } from 'express';
import { z } from 'zod';
import {
  updateRouteStopStatusSchema,
  listRouteStopsQuerySchema,
} from '../schemas/route-stops.schemas';
import * as routeStopService from '../services/route-stops.service';
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

export async function listRouteStops(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(listRouteStopsQuerySchema, req.query);
  const { data, total, page, limit } = await routeStopService.listRouteStops(orgId, query);
  sendPaginated(res, data, total, page, limit);
}

export async function getRouteStopById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await routeStopService.getRouteStopById(id, orgId));
}

export async function updateRouteStopStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateRouteStopStatusSchema, req.body);
  sendSuccess(res, await routeStopService.updateRouteStopStatus(id, orgId, input));
}

export async function getRouteStopsByRouteId(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const routeId = req.params['routeId'] as string;
  sendSuccess(res, await routeStopService.getRouteStopsByRouteId(routeId, orgId));
}
