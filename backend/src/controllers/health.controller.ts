import * as http from 'http';
import * as https from 'https';
import { Request, Response } from 'express';
import { config } from '../config/env';
import { query } from '../config/db';
import { sendSuccess } from '../utils/response';

type CheckStatus = 'ok' | 'error' | 'skipped';

interface CheckResult {
  status: CheckStatus;
  latencyMs?: number;
}

interface HealthPayload {
  status: 'ok' | 'degraded';
  uptime: number;
  version: string;
  timestamp: string;
  checks: {
    database: CheckResult;
    osrm: CheckResult;
  };
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      query('SELECT 1'),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DB health check timed out')), 3000);
      }),
    ]);
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkOsrm(): Promise<CheckResult> {
  if (config.offline.offlineMode || !config.offline.enableExternalApis) {
    return { status: 'skipped' };
  }

  const start = Date.now();
  return new Promise<CheckResult>((resolve) => {
    const client = (config.osrm.baseUrl.startsWith('https://') ? https : http) as typeof http;
    const timer = setTimeout(
      () => resolve({ status: 'error' }),
      config.osrm.timeoutMs,
    );

    const req = client.get(`${config.osrm.baseUrl}/nearest/v1/driving/0,0`, (res) => {
      clearTimeout(timer);
      resolve({
        status: (res.statusCode ?? 500) < 500 ? 'ok' : 'error',
        latencyMs: Date.now() - start,
      });
    });

    req.on('error', () => {
      clearTimeout(timer);
      resolve({ status: 'error', latencyMs: Date.now() - start });
    });
  });
}

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const [database, osrm] = await Promise.all([checkDatabase(), checkOsrm()]);

  const checks = { database, osrm };
  const nonSkipped = Object.values(checks).filter((c) => c.status !== 'skipped');
  const overallStatus: 'ok' | 'degraded' = nonSkipped.every((c) => c.status === 'ok')
    ? 'ok'
    : 'degraded';

  const payload: HealthPayload = {
    status: overallStatus,
    uptime: process.uptime(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    timestamp: new Date().toISOString(),
    checks,
  };

  sendSuccess(res, payload);
}
