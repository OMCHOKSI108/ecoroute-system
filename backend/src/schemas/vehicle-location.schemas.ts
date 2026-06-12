import { z } from 'zod';

export const reportLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  recordedAt: z.string().datetime().optional(),
});

export const listLocationHistoryQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type ReportLocationInput = z.infer<typeof reportLocationSchema>;
export type ListLocationHistoryQuery = z.infer<typeof listLocationHistoryQuerySchema>;
