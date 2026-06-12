import { z } from 'zod';

export const createWasteCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().trim().optional(),
});

export const updateWasteCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export type CreateWasteCategoryInput = z.infer<typeof createWasteCategorySchema>;
export type UpdateWasteCategoryInput = z.infer<typeof updateWasteCategorySchema>;
