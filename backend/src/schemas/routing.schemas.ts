import { z } from 'zod';

export const routeBetweenSchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
});

export const nearestRoadSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const distanceMatrixSchema = z.object({
  latitudes: z.array(z.number().min(-90).max(90)).min(2).max(25),
  longitudes: z.array(z.number().min(-180).max(180)).min(2).max(25),
});

export const tripOptimizeSchema = z.object({
  latitudes: z.array(z.number().min(-90).max(90)).min(2).max(25),
  longitudes: z.array(z.number().min(-180).max(180)).min(2).max(25),
});

export type RouteBetweenInput = z.infer<typeof routeBetweenSchema>;
export type NearestRoadInput = z.infer<typeof nearestRoadSchema>;
export type DistanceMatrixInput = z.infer<typeof distanceMatrixSchema>;
export type TripOptimizeInput = z.infer<typeof tripOptimizeSchema>;
