import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  listOrganizationsQuerySchema,
} from '../schemas/organizations.schemas';
import * as orgService from '../services/organizations.service';
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

export async function createOrganization(req: Request, res: Response): Promise<void> {
  const input = parseBody(createOrganizationSchema, req.body);
  sendSuccess(res, await orgService.createOrganization(input), 201);
}

export async function listOrganizations(req: Request, res: Response): Promise<void> {
  const query = parseQuery(listOrganizationsQuerySchema, req.query);
  const { data, total, page, limit } = await orgService.listOrganizations(query);
  sendPaginated(res, data, total, page, limit);
}

export async function getOrganizationById(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string;
  sendSuccess(res, await orgService.getOrganizationById(id));
}

export async function updateOrganization(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string;
  const input = parseBody(updateOrganizationSchema, req.body);
  sendSuccess(res, await orgService.updateOrganization(id, input));
}
