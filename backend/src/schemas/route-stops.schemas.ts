import { z } from 'zod';

export const routeStopStatusEnum = z.enum(['pending', 'arrived', 'completed', 'skipped', 'failed']);

export const updateRouteStopStatusSchema = z.object({
  status: routeStopStatusEnum,
});

export const listRouteStopsQuerySchema = z.object({
  routeId: z.string().uuid().optional(),
  status: routeStopStatusEnum.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type UpdateRouteStopStatusInput = z.infer<typeof updateRouteStopStatusSchema>;
export type ListRouteStopsQuery = z.infer<typeof listRouteStopsQuerySchema>;
