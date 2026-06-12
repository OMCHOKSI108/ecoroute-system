import { z } from 'zod';

export const createPickupLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required'),
  address: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updatePickupLocationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePickupLocationInput = z.infer<typeof createPickupLocationSchema>;
export type UpdatePickupLocationInput = z.infer<typeof updatePickupLocationSchema>;
