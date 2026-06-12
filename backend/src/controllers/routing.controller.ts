import { Request, Response } from 'express';
import { z } from 'zod';
import {
  routeBetweenSchema,
  nearestRoadSchema,
  distanceMatrixSchema,
  tripOptimizeSchema,
} from '../schemas/routing.schemas';
import * as routingService from '../services/routing.service';
import { ValidationError } from '../types/errors';
import { sendSuccess } from '../utils/response';

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Validation failed', result.error.issues);
  return result.data;
}

export async function routeBetween(req: Request, res: Response): Promise<void> {
  const input = parseBody(routeBetweenSchema, req.body);
  sendSuccess(res, await routingService.routeBetween(input));
}

export async function nearestRoad(req: Request, res: Response): Promise<void> {
  const input = parseBody(nearestRoadSchema, req.body);
  sendSuccess(res, await routingService.nearestRoad(input));
}

export async function distanceMatrix(req: Request, res: Response): Promise<void> {
  const input = parseBody(distanceMatrixSchema, req.body);
  sendSuccess(res, await routingService.distanceMatrix(input));
}

export async function tripOptimize(req: Request, res: Response): Promise<void> {
  const input = parseBody(tripOptimizeSchema, req.body);
  sendSuccess(res, await routingService.tripOptimize(input));
}
