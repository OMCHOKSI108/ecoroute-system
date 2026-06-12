import { z } from 'zod';

export const driverStatusEnum = z.enum(['available', 'assigned', 'off_duty', 'inactive']);

export const updateDriverStatusSchema = z.object({
  driverStatus: driverStatusEnum,
});

export const listDriversQuerySchema = z.object({
  driverStatus: driverStatusEnum.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateDriverSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  driverStatus: driverStatusEnum.optional(),
});

export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;
export type ListDriversQuery = z.infer<typeof listDriversQuerySchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
