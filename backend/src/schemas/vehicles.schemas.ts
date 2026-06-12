import { z } from 'zod';

export const createVehicleSchema = z.object({
  plateNumber: z.string().trim().min(1, 'Plate number is required'),
  model: z.string().trim().min(1, 'Model is required'),
  capacityKg: z.number().positive('Capacity must be a positive number'),
});

// 'dispatched' is intentionally excluded — only set by the dispatch service
export const updateVehicleStatusSchema = z.object({
  status: z.enum(['available', 'maintenance', 'offline']),
});

export const assignDriverSchema = z.object({
  driverId: z.string().uuid('Invalid driver ID format').nullable(),
});

export const listVehiclesQuerySchema = z.object({
  status: z.enum(['available', 'dispatched', 'maintenance', 'offline']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateVehicleSchema = z.object({
  plateNumber: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  capacityKg: z.number().positive().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
