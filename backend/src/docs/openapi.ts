export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EcoRoute Engine API',
    description:
      'Geospatial fleet routing and dispatch optimization platform for waste collection and recycling logistics.',
    version: '1.0.0',
    contact: { name: 'EcoRoute Engine' },
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'string' },
        },
      },
      Business: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          address: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          wasteCategories: { type: 'array', items: { type: 'string' } },
          contactEmail: { type: 'string' },
          contactPhone: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          plateNumber: { type: 'string' },
          model: { type: 'string' },
          capacityKg: { type: 'number' },
          currentLoadKg: { type: 'number' },
          status: { type: 'string', enum: ['available', 'dispatched', 'maintenance', 'offline'] },
          driverId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PickupRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          businessId: { type: 'string', format: 'uuid' },
          assignedVehicleId: { type: 'string', format: 'uuid', nullable: true },
          requestedBy: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
          },
          wasteCategory: { type: 'string' },
          estimatedWeightKg: { type: 'number', nullable: true },
          scheduledAt: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Route: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          vehicleId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['active', 'completed', 'failed'] },
          totalDistanceM: { type: 'number', description: 'Total route distance in metres' },
          totalDurationS: { type: 'number', description: 'Estimated travel time in seconds' },
          geometry: { type: 'object', description: 'GeoJSON LineString of the route' },
          waypoints: { type: 'array', items: { type: 'object' } },
          pickupCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          actorId: { type: 'string', format: 'uuid', nullable: true },
          actorRole: { type: 'string', nullable: true },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          metadata: { type: 'object', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Paginated: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          uptime: { type: 'number' },
          version: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          checks: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['ok', 'error', 'skipped'] },
                  latencyMs: { type: 'number' },
                },
              },
              osrm: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['ok', 'error', 'skipped'] },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Insufficient role permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Business rule conflict (capacity, duplicate assignment, invalid state)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service health status',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthCheck' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new organisation and admin user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orgName', 'orgEmail', 'firstName', 'lastName', 'email', 'password'],
                properties: {
                  orgName: { type: 'string', minLength: 2 },
                  orgEmail: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and obtain JWT tokens',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new token pair',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Refresh token obtained from login or previous refresh' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'New token pair issued',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send password reset OTP',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OTP sent successfully (or silently accepted to prevent enumeration)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { 
                      type: 'object',
                      properties: { message: { type: 'string' } }
                    }
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using OTP',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp', 'newPassword'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string', pattern: '^\\d{6}$', description: '6-digit OTP' },
                  newPassword: { type: 'string', minLength: 8, description: 'Must contain uppercase, lowercase, and number' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password reset successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { 
                      type: 'object',
                      properties: { message: { type: 'string' } }
                    }
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/businesses': {
      get: {
        tags: ['Businesses'],
        summary: 'List businesses in the organisation',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated list of businesses' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Businesses'],
        summary: 'Register a new business',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'address', 'lat', 'lng', 'wasteCategories'],
                properties: {
                  name: { type: 'string' },
                  address: { type: 'string' },
                  lat: { type: 'number', minimum: -90, maximum: 90 },
                  lng: { type: 'number', minimum: -180, maximum: 180 },
                  wasteCategories: { type: 'array', items: { type: 'string' } },
                  contactEmail: { type: 'string', format: 'email' },
                  contactPhone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Business created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Business' } } },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/businesses/{id}': {
      get: {
        tags: ['Businesses'],
        summary: 'Get a business by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Business details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Business' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/vehicles': {
      get: {
        tags: ['Vehicles'],
        summary: 'List vehicles',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'dispatched', 'maintenance', 'offline'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated vehicle list' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Register a new vehicle (admin only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plateNumber', 'model', 'capacityKg'],
                properties: {
                  plateNumber: { type: 'string' },
                  model: { type: 'string' },
                  capacityKg: { type: 'number', minimum: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Vehicle created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/vehicles/{id}': {
      get: {
        tags: ['Vehicles'],
        summary: 'Get vehicle by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Vehicle details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/vehicles/{id}/status': {
      patch: {
        tags: ['Vehicles'],
        summary: 'Update vehicle status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['available', 'maintenance', 'offline'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated vehicle', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/vehicles/{id}/driver': {
      post: {
        tags: ['Vehicles'],
        summary: 'Assign or unassign a driver (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['driverId'],
                properties: { driverId: { type: 'string', format: 'uuid', nullable: true, description: 'null to unassign' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated vehicle', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/pickups': {
      get: {
        tags: ['Pickups'],
        summary: 'List pickup requests',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated pickup list' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Pickups'],
        summary: 'Create a pickup request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['businessId', 'wasteCategory'],
                properties: {
                  businessId: { type: 'string', format: 'uuid' },
                  wasteCategory: { type: 'string' },
                  estimatedWeightKg: { type: 'number', minimum: 0 },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Pickup created', content: { 'application/json': { schema: { $ref: '#/components/schemas/PickupRequest' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/pickups/my': {
      get: {
        tags: ['Pickups'],
        summary: 'List pickups assigned to the authenticated driver\'s vehicle',
        description: 'Returns pickups with status `assigned` or `in_progress` for the vehicle where `driver_id` matches the caller. Role: driver only.',
        responses: {
          200: {
            description: 'List of pickups for this driver',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PickupRequest' } } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/pickups/nearby': {
      get: {
        tags: ['Pickups'],
        summary: 'Find nearby pending pickups using PostGIS radius search',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 } },
          { name: 'radiusMeters', in: 'query', schema: { type: 'number', default: 5000, maximum: 50000 } },
        ],
        responses: {
          200: { description: 'Array of nearby pickups ordered by distance' },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/pickups/{id}': {
      get: {
        tags: ['Pickups'],
        summary: 'Get pickup by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Pickup details', content: { 'application/json': { schema: { $ref: '#/components/schemas/PickupRequest' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/pickups/{id}/status': {
      patch: {
        tags: ['Pickups'],
        summary: 'Update pickup status (cancel pending, complete in-progress)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['cancelled', 'completed'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated pickup' },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/dispatch/assign': {
      post: {
        tags: ['Dispatch'],
        summary: 'Assign pickup requests to a vehicle (transactional, capacity-checked)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicleId', 'pickupIds'],
                properties: {
                  vehicleId: { type: 'string', format: 'uuid' },
                  pickupIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Dispatch successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    vehicle: { $ref: '#/components/schemas/Vehicle' },
                    pickups: { type: 'array', items: { $ref: '#/components/schemas/PickupRequest' } },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/routes/generate': {
      post: {
        tags: ['Routes'],
        summary: 'Generate an optimised route via OSRM for a dispatched vehicle',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicleId'],
                properties: { vehicleId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: {
          201: { description: 'Route generated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Route' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/routes': {
      get: {
        tags: ['Routes'],
        summary: 'List routes',
        parameters: [
          { name: 'vehicleId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'completed', 'failed'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated route list' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/routes/{id}': {
      get: {
        tags: ['Routes'],
        summary: 'Get route by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Route details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Route' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/routes/{id}/status': {
      patch: {
        tags: ['Routes'],
        summary: 'Complete an active route (resets vehicle, completes pickups)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['completed'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Route completed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Route' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Overall fleet, pickup, and route summary metrics',
        responses: {
          200: {
            description: 'Dashboard summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    fleet: { type: 'object', properties: { total: { type: 'integer' }, available: { type: 'integer' }, dispatched: { type: 'integer' }, maintenance: { type: 'integer' }, offline: { type: 'integer' } } },
                    pickups: { type: 'object' },
                    routes: { type: 'object' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/dashboard/vehicles': {
      get: {
        tags: ['Dashboard'],
        summary: 'Per-vehicle workload and utilisation',
        responses: {
          200: { description: 'Vehicle workload list' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/dashboard/pickups': {
      get: {
        tags: ['Dashboard'],
        summary: 'Pickup statistics by status and waste category',
        responses: {
          200: { description: 'Pickup statistics' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'List audit log entries (admin only)',
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: {
            description: 'Paginated audit log',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Paginated' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};
