import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errors';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'FREE' | 'PREMIUM' | 'ADMIN';
}

// Extend Express Request to carry the verified user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function getSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET env var is not set');
  return secret;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '1d' });
}

// Shared cookie attributes so set and clear always match (a mismatch can leave
// the cookie undeletable on logout — finding M-CLEARCOOKIE). `secure` is forced
// on in production so the session cookie is never sent over plain HTTP, even if
// COOKIE_SECURE is left unset (finding M-COOKIE-SECURE).
const AUTH_COOKIE_NAME = 'sv_token';
const authCookieOptions = {
  httpOnly: true,
  secure: process.env['COOKIE_SECURE'] === 'true' || process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Sets the auth JWT as an HttpOnly cookie so it never reaches client-side JS.
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...authCookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

// Clears the auth cookie (used by logout). Must reuse the same attributes.
export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Prefer the HttpOnly cookie; fall back to the Authorization header for
  // API tooling / non-browser clients.
  let token: string | undefined = req.cookies?.['sv_token'];
  if (!token) {
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
    }
  }
  if (!token) {
    const err: AppError = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }
  try {
    const payload = jwt.verify(token, getSecret()) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    const err: AppError = new Error('Invalid or expired token');
    err.statusCode = 401;
    next(err);
  }
}

// Media auth: reads the JWT from the HttpOnly `sv_token` cookie first, with a
// fallback to the Authorization header for API tooling / non-browser clients.
// The previous `?token=` query-param fallback has been removed: the browser
// sends the HttpOnly cookie automatically on <video>/<audio>/<a download>
// requests, so it is no longer needed — and tokens in URLs could leak via
// logs, referrers and browser history (finding A3).
export function requireMediaAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined = req.cookies?.['sv_token'];
  if (!token) {
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
    }
  }

  if (!token) {
    const err: AppError = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }

  try {
    const payload = jwt.verify(token, getSecret()) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    const err: AppError = new Error('Invalid or expired token');
    err.statusCode = 401;
    next(err);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    const err: AppError = new Error('Admin access required');
    err.statusCode = 403;
    return next(err);
  }
  next();
}

// Reads the JWT if present and populates req.user, but never rejects the request.
// Use this on public routes that have premium-aware behaviour (e.g. download bypass).
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined = req.cookies?.['sv_token'];
  if (!token) {
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
    }
  }
  if (token) {
    try {
      const payload = jwt.verify(token, getSecret()) as AuthPayload;
      req.user = payload;
    } catch {
      // Invalid/expired token — treat as anonymous, do not reject
    }
  }
  next();
}
