import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createPickupLocationSchema,
  updatePickupLocationSchema,
} from '../schemas/pickup-locations.schemas';
import * as plService from '../services/pickup-locations.service';
import { ValidationError } from '../types/errors';
import { sendSuccess } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Validation failed', result.error.issues);
  return result.data;
}

export async function createPickupLocation(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const businessId = req.params['id'] as string;
  const input = parseBody(createPickupLocationSchema, req.body);
  sendSuccess(res, await plService.createPickupLocation(businessId, orgId, input), 201);
}

export async function listPickupLocations(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const businessId = req.params['id'] as string;
  sendSuccess(res, await plService.listPickupLocations(businessId, orgId));
}

export async function getPickupLocationById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await plService.getPickupLocationById(id, orgId));
}

export async function updatePickupLocation(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updatePickupLocationSchema, req.body);
  sendSuccess(res, await plService.updatePickupLocation(id, orgId, input));
}

export async function deletePickupLocation(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  await plService.deletePickupLocation(id, orgId);
  sendSuccess(res, { deleted: true });
}
