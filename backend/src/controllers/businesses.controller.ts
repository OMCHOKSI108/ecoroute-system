import { Request, Response } from 'express';
import { z } from 'zod';
import { createBusinessSchema, listBusinessesQuerySchema } from '../schemas/businesses.schemas';
import * as businessService from '../services/businesses.service';
import { ValidationError } from '../types/errors';
import { sendSuccess, sendPaginated } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.issues);
  }
  return result.data;
}

function parseQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ValidationError('Invalid query parameters', result.error.issues);
  }
  return result.data;
}

export async function createBusiness(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(createBusinessSchema, req.body);
  const business = await businessService.createBusiness(input, orgId);
  sendSuccess(res, business, 201);
}

export async function listBusinesses(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const queryParams = parseQuery(listBusinessesQuerySchema, req.query);
  const { data, total, page, limit } = await businessService.listBusinesses(orgId, queryParams);
  sendPaginated(res, data, total, page, limit);
}

export async function getBusinessById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const business = await businessService.getBusinessById(id, orgId);
  sendSuccess(res, business);
}
