import { z } from 'zod';

export const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    role: z.enum(['admin', 'dispatcher', 'driver', 'business_user']),
    phone: z.string().trim().optional(),
    businessId: z.string().uuid('Invalid business UUID').optional(),
    vehicleId: z.string().uuid('Invalid vehicle UUID').optional(),
    driverStatus: z.enum(['available', 'assigned', 'off_duty', 'inactive']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'business_user' && !data.businessId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'businessId is required when creating a business_user',
        path: ['businessId'],
      });
    }
  });

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'dispatcher', 'driver', 'business_user']),
  businessId: z.string().uuid('Invalid business UUID').nullable().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(['admin', 'dispatcher', 'driver', 'business_user']).optional(),
  phone: z.string().trim().nullable().optional(),
  businessId: z.string().uuid().nullable().optional(),
  vehicleId: z.string().uuid().nullable().optional(),
  driverStatus: z.enum(['available', 'assigned', 'off_duty', 'inactive']).nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['admin', 'dispatcher', 'driver', 'business_user']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateMeSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
