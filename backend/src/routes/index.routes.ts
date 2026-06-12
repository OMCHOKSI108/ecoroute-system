import { Router, Request, Response } from 'express';
import { config } from '../config/env';

export const indexRouter = Router();

const base = config.apiPrefix;

indexRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: config.appName,
    version: '1.0.0',
    docs: `${base}/docs`,
    endpoints: {
      health: { GET: `${base}/health` },
      auth: {
        'POST register': `${base}/auth/register`,
        'POST login': `${base}/auth/login`,
        'POST refresh': `${base}/auth/refresh`,
        'POST logout': `${base}/auth/logout`,
        'POST forgot-password': `${base}/auth/forgot-password`,
        'POST reset-password': `${base}/auth/reset-password`,
      },
      users: {
        'GET me': `${base}/users/me`,
        'GET list': `${base}/users`,
        'GET by id': `${base}/users/:id`,
        'PATCH role': `${base}/users/:id/role`,
        'PATCH status': `${base}/users/:id/status`,
      },
      organizations: {
        'GET list': `${base}/organizations`,
        'POST create': `${base}/organizations`,
        'GET by id': `${base}/organizations/:id`,
        'PATCH update': `${base}/organizations/:id`,
      },
      businesses: {
        'GET list': `${base}/businesses`,
        'POST create': `${base}/businesses`,
        'GET by id': `${base}/businesses/:id`,
        'PATCH update': `${base}/businesses/:id`,
      },
      pickupLocations: {
        'GET by business': `${base}/businesses/:id/locations`,
        'POST create': `${base}/businesses/:id/locations`,
        'GET by id': `${base}/pickup-locations/:id`,
        'PATCH update': `${base}/pickup-locations/:id`,
        'DELETE remove': `${base}/pickup-locations/:id`,
      },
      wasteCategories: {
        'GET list': `${base}/waste-categories`,
        'POST create': `${base}/waste-categories`,
        'GET by id': `${base}/waste-categories/:id`,
        'PATCH update': `${base}/waste-categories/:id`,
      },
      drivers: {
        'GET list': `${base}/drivers`,
        'POST create': `${base}/drivers`,
        'GET by id': `${base}/drivers/:id`,
        'PATCH status': `${base}/drivers/:id/status`,
        'GET assigned vehicle': `${base}/drivers/:id/vehicle`,
        'POST assign vehicle': `${base}/drivers/:id/vehicle/:vehicleId`,
        'DELETE unassign vehicle': `${base}/drivers/:id/vehicle/:vehicleId`,
      },
      vehicles: {
        'GET list': `${base}/vehicles`,
        'POST create': `${base}/vehicles`,
        'GET by id': `${base}/vehicles/:id`,
        'PATCH status': `${base}/vehicles/:id/status`,
        'POST assign driver': `${base}/vehicles/:id/driver`,
        'POST update location': `${base}/vehicle-locations/:vehicleId`,
        'GET latest location': `${base}/vehicle-locations/:vehicleId/latest`,
        'GET location history': `${base}/vehicle-locations/:vehicleId/history`,
      },
      pickups: {
        'GET list': `${base}/pickups`,
        'POST create': `${base}/pickups`,
        'GET my driver pickups': `${base}/pickups/my`,
        'GET nearby': `${base}/pickups/nearby`,
        'GET by id': `${base}/pickups/:id`,
        'PATCH status': `${base}/pickups/:id/status`,
        'POST cancel': `${base}/pickups/:id/cancel`,
      },
      dispatch: {
        'POST preview': `${base}/dispatch/preview`,
        'POST assign': `${base}/dispatch/assign`,
        'POST auto assign': `${base}/dispatch/auto-assign`,
      },
      routes: {
        'POST generate': `${base}/routes/generate`,
        'GET list': `${base}/routes`,
        'GET by id': `${base}/routes/:id`,
        'PATCH status': `${base}/routes/:id/status`,
        'GET stops': `${base}/routes/:id/stops`,
        'PATCH stop status': `${base}/route-stops/:id/status`,
        'PATCH reorder stops': `${base}/routes/:id/stops/reorder`,
      },
      routing: {
        'POST nearest': `${base}/routing/nearest`,
        'POST distance matrix': `${base}/routing/matrix`,
        'POST trip optimize': `${base}/routing/trip`,
        'POST route': `${base}/routing/route`,
      },
      dashboard: {
        'GET summary': `${base}/dashboard/summary`,
        'GET vehicle workloads': `${base}/dashboard/vehicles`,
        'GET pickup stats': `${base}/dashboard/pickups`,
        'GET route performance': `${base}/dashboard/routes`,
        'GET fleet utilization': `${base}/dashboard/fleet-utilization`,
        'GET daily stats': `${base}/dashboard/daily-stats`,
        'GET trends': `${base}/dashboard/trends`,
        'GET driver activity': `${base}/dashboard/drivers`,
      },
      notifications: {
        'GET list': `${base}/notifications`,
        'GET unread count': `${base}/notifications/unread-count`,
        'POST create': `${base}/notifications`,
        'PATCH mark all read': `${base}/notifications/read-all`,
        'PATCH mark read': `${base}/notifications/:id/read`,
      },
      routeStops: {
        'GET list': `${base}/route-stops`,
        'GET by route': `${base}/route-stops/by-route/:routeId`,
        'GET by id': `${base}/route-stops/:id`,
        'PATCH status': `${base}/route-stops/:id/status`,
      },
      vehicleLocations: {
        'GET all latest': `${base}/vehicle-locations`,
        'POST report': `${base}/vehicle-locations/:vehicleId`,
        'GET latest': `${base}/vehicle-locations/:vehicleId/latest`,
        'GET history': `${base}/vehicle-locations/:vehicleId/history`,
      },
      auditLogs: {
        'GET list': `${base}/audit-logs`,
      },
    },
  });
});
