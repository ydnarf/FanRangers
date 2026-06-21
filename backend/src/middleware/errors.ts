import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Central error-handling middleware.
 * Must be registered AFTER all routes (Express requires 4-argument signature).
 * Never exposes stack traces or internal details to the client.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Always log the full error server-side
  console.error('[Error]', err.message, err.stack ?? '');

  const status = err.statusCode ?? 500;

  let message: string;
  if (process.env['NODE_ENV'] === 'production') {
    if (status >= 500) message = 'Internal server error';
    else if (status === 404) message = 'Not found';
    else if (status === 400) message = 'Bad request';
    else message = 'Request error';
  } else {
    message = err.message;
  }

  res.status(status).json({ error: message });
}

/**
 * 404 handler — must be registered after all routes but before errorHandler.
 */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  const err: AppError = new Error('Route not found');
  err.statusCode = 404;
  next(err);
}
