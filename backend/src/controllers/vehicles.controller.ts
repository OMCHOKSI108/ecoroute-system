import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createVehicleSchema,
  updateVehicleStatusSchema,
  assignDriverSchema,
  listVehiclesQuerySchema,
} from '../schemas/vehicles.schemas';
import * as vehicleService from '../services/vehicles.service';
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

export async function createVehicle(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(createVehicleSchema, req.body);
  sendSuccess(res, await vehicleService.createVehicle(input, orgId), 201);
}

export async function listVehicles(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(listVehiclesQuerySchema, req.query);
  const { data, total, page, limit } = await vehicleService.listVehicles(orgId, query);
  sendPaginated(res, data, total, page, limit);
}

export async function getVehicleById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await vehicleService.getVehicleById(id, orgId));
}

export async function updateVehicleStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateVehicleStatusSchema, req.body);
  sendSuccess(res, await vehicleService.updateVehicleStatus(id, orgId, input));
}

export async function assignDriver(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(assignDriverSchema, req.body);
  sendSuccess(res, await vehicleService.assignDriver(id, orgId, input));
}
