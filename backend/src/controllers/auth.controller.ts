import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  registerSchema, 
  loginSchema, 
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schemas';
import * as authService from '../services/auth.service';
import { ValidationError } from '../types/errors';
import { sendSuccess } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.issues);
  }
  return result.data;
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = parseBody(registerSchema, req.body);
  const data = await authService.register(input);
  sendSuccess(res, data, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = parseBody(loginSchema, req.body);
  const data = await authService.login(input);
  sendSuccess(res, data);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const input = parseBody(refreshSchema, req.body);
  const data = await authService.refresh(input);
  sendSuccess(res, data);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input = parseBody(forgotPasswordSchema, req.body);
  const result = await authService.forgotPassword(input.email);
  
  sendSuccess(res, result);
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = parseBody(resetPasswordSchema, req.body);
  const result = await authService.resetPassword({
    email: input.email,
    otp: input.otp,
    newPassword: input.newPassword,
  });
  
  sendSuccess(res, result);
}