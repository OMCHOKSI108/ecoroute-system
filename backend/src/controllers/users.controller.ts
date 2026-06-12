import { Request, Response } from 'express';
import { z } from 'zod';
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
} from '../schemas/users.schemas';
import * as userService from '../services/users.service';
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

export async function getMe(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  sendSuccess(res, await userService.getMe(userId));
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const query = parseQuery(listUsersQuerySchema, req.query);
  const { data, total, page, limit } = await userService.listUsers(orgId, query);
  sendPaginated(res, data, total, page, limit);
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  sendSuccess(res, await userService.getUserById(id, orgId));
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateUserRoleSchema, req.body);
  sendSuccess(res, await userService.updateUserRole(id, orgId, input));
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const orgId = req.user!.orgId;
  const id = req.params['id'] as string;
  const input = parseBody(updateUserStatusSchema, req.body);
  sendSuccess(res, await userService.updateUserStatus(id, orgId, input));
}
