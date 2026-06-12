import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import { openapiSpec } from './docs/openapi';
import { indexRouter } from './routes/index.routes';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { businessesRouter } from './routes/businesses.routes';
import { vehiclesRouter } from './routes/vehicles.routes';
import { pickupsRouter } from './routes/pickups.routes';
import { dispatchRouter } from './routes/dispatch.routes';
import { routesRouter } from './routes/routes.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { auditRouter } from './routes/audit.routes';
import { usersRouter } from './routes/users.routes';
import { organizationsRouter } from './routes/organizations.routes';
import { pickupLocationsRouter } from './routes/pickup-locations.routes';
import { wasteCategoriesRouter } from './routes/waste-categories.routes';
import { driversRouter } from './routes/drivers.routes';
import { routeStopsRouter } from './routes/route-stops.routes';
import { vehicleLocationRouter } from './routes/vehicle-location.routes';
import { routingRouter } from './routes/routing.routes';
import { notificationsRouter } from './routes/notifications.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Swagger UI — available at /api/v1/docs
  app.use(`${config.apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Root listing
  app.use(config.apiPrefix, indexRouter);

  // Domain routes
  app.use(`/`, indexRouter);
  app.use(`${config.apiPrefix}/health`, healthRouter);
  app.use(`${config.apiPrefix}/auth`, authRouter);
  app.use(`${config.apiPrefix}/businesses`, businessesRouter);
  app.use(`${config.apiPrefix}/vehicles`, vehiclesRouter);
  app.use(`${config.apiPrefix}/pickups`, pickupsRouter);
  app.use(`${config.apiPrefix}/dispatch`, dispatchRouter);
  app.use(`${config.apiPrefix}/routes`, routesRouter);
  app.use(`${config.apiPrefix}/dashboard`, dashboardRouter);
  app.use(`${config.apiPrefix}/audit-logs`, auditRouter);
  app.use(`${config.apiPrefix}/users`, usersRouter);
  app.use(`${config.apiPrefix}/organizations`, organizationsRouter);
  app.use(`${config.apiPrefix}/pickup-locations`, pickupLocationsRouter);
  app.use(`${config.apiPrefix}/waste-categories`, wasteCategoriesRouter);
  app.use(`${config.apiPrefix}/drivers`, driversRouter);
  app.use(`${config.apiPrefix}/route-stops`, routeStopsRouter);
  app.use(`${config.apiPrefix}/vehicle-locations`, vehicleLocationRouter);
  app.use(`${config.apiPrefix}/routing`, routingRouter);
  app.use(`${config.apiPrefix}/notifications`, notificationsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
