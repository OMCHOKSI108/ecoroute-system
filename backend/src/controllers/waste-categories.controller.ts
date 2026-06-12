import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createWasteCategorySchema,
  updateWasteCategorySchema,
} from '../schemas/waste-categories.schemas';
import * as wcService from '../services/waste-categories.service';
import { ValidationError } from '../types/errors';
import { sendSuccess } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Validation failed', result.error.issues);
  return result.data;
}

export async function createWasteCategory(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const input = parseBody(createWasteCategorySchema, req.body);
  sendSuccess(res, await wcService.createWasteCategory(orgId, input), 201);
}

export async function listWasteCategories(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  sendSuccess(res, await wcService.listWasteCategories(orgId));
}

export async function getWasteCategoryById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await wcService.getWasteCategoryById(id, orgId));
}

export async function updateWasteCategory(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateWasteCategorySchema, req.body);
  sendSuccess(res, await wcService.updateWasteCategory(id, orgId, input));
}
