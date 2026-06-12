import request from 'supertest';
import express from 'express';

jest.mock('../src/config/db');

import { query } from '../src/config/db';
import { createApp } from '../src/app';
import { errorHandler } from '../src/middlewares/errorHandler';
import { UnauthorizedError } from '../src/types/errors';

const mockQuery = query as jest.MockedFunction<typeof query>;

const app = createApp();

describe('GET /api/v1/health', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 200 with expected shape fields', async () => {
    mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] } as never);

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks).toHaveProperty('osrm');
  });

  it('returns osrm.status = "skipped" when OFFLINE_MODE is true', async () => {
    mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] } as never);

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.checks.osrm.status).toBe('skipped');
  });

  it('returns database.status = "ok" on successful SELECT 1', async () => {
    mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] } as never);

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.checks.database.status).toBe('ok');
    expect(res.body.status).toBe('ok');
  });

  it('returns database.status = "error" when query rejects', async () => {
    mockQuery.mockRejectedValue(new Error('Connection refused'));

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.checks.database.status).toBe('error');
  });

  it('returns overall status = "degraded" when DB fails, HTTP still 200', async () => {
    mockQuery.mockRejectedValue(new Error('Connection refused'));

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
  });
});

describe('404 handler', () => {
  it('returns 404 with { error: "NOT_FOUND" } for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route-xyz');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
    expect(res.body).toHaveProperty('message');
  });
});

describe('Error handler', () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('returns { error, message } shape when next(err) is called', async () => {
    const throwingApp = express();
    throwingApp.use(express.json());
    throwingApp.get('/throw', (_req: unknown, _res: unknown, next: (err: unknown) => void) => {
      next(new Error('Test error'));
    });
    throwingApp.use(errorHandler);

    const res = await request(throwingApp).get('/throw');

    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.error).toBe('string');
    expect(typeof res.body.message).toBe('string');
  });

  it('logs expected 4xx errors as warnings without response stacks', async () => {
    const throwingApp = express();
    throwingApp.get('/protected', (_req: unknown, _res: unknown, next: (err: unknown) => void) => {
      next(new UnauthorizedError('No token provided'));
    });
    throwingApp.use(errorHandler);

    const res = await request(throwingApp).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
    expect(res.body.message).toBe('No token provided');
    expect(res.body).not.toHaveProperty('stack');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('keeps unexpected 5xx errors on the error logger', async () => {
    const throwingApp = express();
    throwingApp.get('/throw', (_req: unknown, _res: unknown, next: (err: unknown) => void) => {
      next(new Error('Test error'));
    });
    throwingApp.use(errorHandler);

    const res = await request(throwingApp).get('/throw');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
