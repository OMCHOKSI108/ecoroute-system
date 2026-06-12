import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function shouldLog(level: LogLevel): boolean {
  const configured = (config.logLevel as LogLevel) ?? 'info';
  return LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(configured);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!config.enableRequestLogging) {
    next();
    return;
  }

  const start = Date.now();

  res.on('finish', () => {
    if (!shouldLog('info')) return;
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'request',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
        userId: req.user?.sub ?? null,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      }),
    );
  });

  next();
}
