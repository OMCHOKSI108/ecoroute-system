import { z } from 'zod';

export const createPickupSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  wasteCategory: z.string().trim().min(1, 'Waste category is required'),
  estimatedWeightKg: z.number().positive('Weight must be positive').optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().trim().optional(),
});

// Only transitions callable via the PATCH endpoint; service enforces valid source state
export const updatePickupStatusSchema = z.object({
  status: z.enum(['cancelled', 'completed']),
});

export const listPickupsQuerySchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  vehicleId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const nearbyPickupsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().positive().max(50000).optional().default(5000),
});

export const cancelPickupSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const updatePickupSchema = z.object({
  wasteCategory: z.string().trim().min(1).optional(),
  estimatedWeightKg: z.number().positive().optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().trim().optional(),
});

export type CreatePickupInput = z.infer<typeof createPickupSchema>;
export type UpdatePickupStatusInput = z.infer<typeof updatePickupStatusSchema>;
export type ListPickupsQuery = z.infer<typeof listPickupsQuerySchema>;
export type NearbyPickupsQuery = z.infer<typeof nearbyPickupsQuerySchema>;
export type CancelPickupInput = z.infer<typeof cancelPickupSchema>;
export type UpdatePickupInput = z.infer<typeof updatePickupSchema>;
