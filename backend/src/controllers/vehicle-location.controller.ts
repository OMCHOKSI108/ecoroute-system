import { Request, Response } from 'express';
import { z } from 'zod';
import {
  reportLocationSchema,
  listLocationHistoryQuerySchema,
} from '../schemas/vehicle-location.schemas';
import * as vlService from '../services/vehicle-location.service';
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

export async function reportLocation(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const vehicleId = req.params['vehicleId'] as string;
  const input = parseBody(reportLocationSchema, req.body);
  sendSuccess(res, await vlService.reportLocation(vehicleId, orgId, input), 201);
}

export async function getLatestLocation(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const vehicleId = req.params['vehicleId'] as string;
  sendSuccess(res, await vlService.getLatestLocation(vehicleId, orgId));
}

export async function getAllLatestLocations(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await vlService.getAllLatestLocations(orgId));
}

export async function getLocationHistory(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const vehicleId = req.params['vehicleId'] as string;
  const query = parseQuery(listLocationHistoryQuerySchema, req.query);
  const { data, total, page, limit } = await vlService.getLocationHistory(vehicleId, orgId, query);
  sendPaginated(res, data, total, page, limit);
}
