import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  if (Array.isArray(data)) {
    res.status(statusCode).json({ success: true, data });
  } else if (data !== null && typeof data === 'object') {
    res.status(statusCode).json({ success: true, ...(data as object) });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode = 200,
) {
  res.status(statusCode).json({
    success: true,
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
