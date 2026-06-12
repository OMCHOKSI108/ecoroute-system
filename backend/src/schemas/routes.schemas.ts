import { z } from 'zod';

export const generateRouteSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
});

// Only 'completed' is settable via the API — 'active' is set on generation, 'failed' is internal
export const updateRouteStatusSchema = z.object({
  status: z.enum(['completed']),
});

export const listRoutesQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  status: z.enum(['active', 'completed', 'failed']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type GenerateRouteInput = z.infer<typeof generateRouteSchema>;
export type UpdateRouteStatusInput = z.infer<typeof updateRouteStatusSchema>;
export type ListRoutesQuery = z.infer<typeof listRoutesQuerySchema>;
