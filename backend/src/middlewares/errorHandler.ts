import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

const HTTP_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const statusCode =
    (err as { status?: number }).status ??
    (err as { statusCode?: number }).statusCode ??
    500;
  const isServerError = statusCode >= 500;
  const logPayload = {
    level: isServerError ? 'error' : 'warn',
    message,
    path: req.path,
    method: req.method,
    statusCode,
    stack: isServerError && config.nodeEnv !== 'production' ? stack : undefined,
  };

  const log = isServerError ? console.error : console.warn;
  log(JSON.stringify(logPayload));

  const body: Record<string, unknown> = {
    success: false,
    error: HTTP_CODES[statusCode] ?? 'INTERNAL_SERVER_ERROR',
    message,
  };

  if (isServerError && config.nodeEnv !== 'production' && stack) {
    body['stack'] = stack;
  }

  res.status(statusCode).json(body);
}
