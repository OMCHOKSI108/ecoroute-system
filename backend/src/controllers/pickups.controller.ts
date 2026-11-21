import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createPickupSchema,
  updatePickupStatusSchema,
  listPickupsQuerySchema,
  nearbyPickupsQuerySchema,
  cancelPickupSchema,
} from '../schemas/pickups.schemas';
import * as pickupService from '../services/pickups.service';
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

export async function createPickup(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const requestedBy = req.user!.sub;
  const role = req.user!.role;
  const businessId = req.user!.businessId;
  const input = parseBody(createPickupSchema, req.body);
  sendSuccess(res, await pickupService.createPickup(input, orgId, requestedBy, role, businessId), 201);
}

export async function listPickups(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const role = req.user!.role;
  const businessId = req.user!.businessId;
  const query = parseQuery(listPickupsQuerySchema, req.query);
  const { data, total, page, limit } = await pickupService.listPickups(orgId, query, role, businessId);
  sendPaginated(res, data, total, page, limit);
}

export async function getPickupById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const role = req.user!.role;
  const businessId = req.user!.businessId;
  const id = req.params['id'] as string;
  sendSuccess(res, await pickupService.getPickupById(id, orgId, role, businessId));
}

export async function updatePickupStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updatePickupStatusSchema, req.body);
  sendSuccess(res, await pickupService.updatePickupStatus(id, orgId, input, req.user!.sub, req.user!.role));
}

export async function getMyPickups(req: Request, res: Response): Promise<void> {
  const { sub: userId, orgId, role, businessId } = req.user!;
  sendSuccess(res, await pickupService.getMyPickups(userId, orgId, role, businessId));
}

export async function cancelPickup(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(cancelPickupSchema, req.body);
  sendSuccess(res, await pickupService.cancelPickup(id, orgId, input, req.user!.sub, req.user!.role));
}

export async function getNearbyPickups(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(nearbyPickupsQuerySchema, req.query);
  const data = await pickupService.getNearbyPickups(orgId, query);
  sendSuccess(res, { data });
}
