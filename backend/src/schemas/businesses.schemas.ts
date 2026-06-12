import { z } from 'zod';

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  address: z.string().trim().min(5, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contactEmail: z.string().trim().toLowerCase().email('Invalid contact email').optional(),
  contactPhone: z.string().trim().optional(),
  wasteCategories: z.array(z.string().trim()).optional().default([]),
});

export const listBusinessesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type ListBusinessesQuery = z.infer<typeof listBusinessesQuerySchema>;
