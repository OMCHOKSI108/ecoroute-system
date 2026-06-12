import { z } from 'zod';

export const assignDispatchSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  pickupIds: z.array(z.string().uuid('Invalid pickup ID')).min(1, 'At least one pickup is required'),
});

export const dispatchPreviewSchema = z.object({
  pickupIds: z.array(z.string().uuid('Invalid pickup ID')).min(1, 'At least one pickup is required'),
});

export const autoAssignSchema = z.object({
  maxPickupsPerVehicle: z.number().int().positive().optional().default(10),
  maxWeightPerVehicle: z.number().positive().optional(),
});

export type AssignDispatchInput = z.infer<typeof assignDispatchSchema>;
export type DispatchPreviewInput = z.infer<typeof dispatchPreviewSchema>;
export type AutoAssignInput = z.infer<typeof autoAssignSchema>;
