import { Request, Response } from 'express';
import { z } from 'zod';
import {
  updateDriverStatusSchema,
  listDriversQuerySchema,
} from '../schemas/drivers.schemas';
import * as driverService from '../services/drivers.service';
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

export async function listDrivers(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(listDriversQuerySchema, req.query);
  const { data, total, page, limit } = await driverService.listDrivers(orgId, query);
  sendPaginated(res, data, total, page, limit);
}

export async function getDriverById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await driverService.getDriverById(id, orgId));
}

export async function updateDriverStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateDriverStatusSchema, req.body);
  sendSuccess(res, await driverService.updateDriverStatus(id, orgId, input));
}

export async function assignVehicle(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const driverId = req.params['id'] as string;
  const vehicleId = req.params['vehicleId'] as string;
  sendSuccess(res, await driverService.assignVehicle(driverId, vehicleId, orgId));
}

export async function unassignVehicle(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const vehicleId = req.params['vehicleId'] as string;
  sendSuccess(res, await driverService.unassignVehicle(vehicleId, orgId));
}
