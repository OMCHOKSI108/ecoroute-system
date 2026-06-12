import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../types/errors';
import type { Role } from '../types/auth';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
