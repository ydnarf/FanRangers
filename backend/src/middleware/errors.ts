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

  // 4xx are client errors whose messages are curated and safe to surface
  // (validation failures, "not found", duplicate-number conflicts, …) — showing
  // them lets the user correct their input. 5xx may carry internal details, so
  // they stay masked in production and only reveal the message in development.
  let message: string;
  if (status >= 500) {
    message = process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message;
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
