import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { collectionsRouter } from './routes/collections';
import { seasonsRouter } from './routes/seasons';
import { episodesRouter } from './routes/episodes';
import { videosRouter } from './routes/videos';
import { downloadRouter } from './routes/download';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import {
  statsRouter,
  adminCollectionsRouter,
  adminSeasonsRouter,
  adminEpisodesRouter,
  adminVideosRouter,
  adminUploadRouter,
  adminUsersRouter,
} from './routes/admin/index';
import { requireAuth, requireAdmin } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errors';

// ─── App setup ──────────────────────────────────────────────────────────────

if (!process.env['NODE_ENV']) {
  console.warn('[WARNING] NODE_ENV is not set. Running in development mode — error details will be exposed.');
}

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const IS_PROD = process.env['NODE_ENV'] === 'production';

// ─── Production startup guard: JWT_SECRET must be set and not the dev default ─

const OLD_JWT_DEFAULT = 'dev-jwt-secret-change-this-in-production-min-32-chars';
if (IS_PROD) {
  const secret = process.env['JWT_SECRET'];
  if (!secret || secret === OLD_JWT_DEFAULT) {
    throw new Error(
      'JWT_SECRET must be set to a secure, unique value in production (cannot be empty or the dev default).',
    );
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters of entropy in production.');
  }
  if (process.env['COOKIE_SECURE'] !== 'true') {
    throw new Error('COOKIE_SECURE must be "true" in production so the session cookie is HTTPS-only.');
  }
}

// Trust proxy (configurable) so rate-limit & secure cookies see the real client
// IP / protocol behind a reverse proxy (finding A5).
app.set('trust proxy', Number(process.env['TRUST_PROXY'] ?? 0));

// ─── Allowed CORS origins ────────────────────────────────────────────────────

const allowedOrigins: string[] = ['http://localhost:5173'];

const envOrigin = process.env['ALLOWED_ORIGIN'];
if (envOrigin && envOrigin !== 'http://localhost:5173') {
  allowedOrigins.push(envOrigin);
}

// ─── Security middleware ─────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Disallowed origins get a clean 403 (not a 500) via the error handler.
      const forbidden = (msg: string): Error => {
        const err = new Error(msg) as Error & { statusCode?: number };
        err.statusCode = 403;
        return err;
      };
      // In production, require an Origin header to block direct API scrapers
      if (!origin) {
        if (IS_PROD) {
          callback(forbidden('CORS: origin header required'));
          return;
        }
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(forbidden(`CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    credentials: true,
  }),
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ─── CSRF defense for cookie-based auth ──────────────────────────────────────
// The auth JWT now rides in an auto-sent cookie, so state-changing requests are
// exposed to CSRF. Reject any unsafe-method request whose Origin header is
// present but not allowlisted: browsers always send Origin on cross-site
// POST/PUT/PATCH/DELETE, so this blocks forged cross-site mutations. Requests
// with no Origin (curl / API tooling using the Bearer fallback) are allowed,
// and same-origin requests pass because their Origin is allowlisted. This is
// defense-in-depth alongside the cookie's SameSite=Lax attribute.
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!UNSAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: 'CSRF: cross-origin request blocked' });
    return;
  }
  next();
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const downloadLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many download requests, please try again later.' },
});

// Stricter rate limiter for auth endpoints — prevents brute force attacks
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// ─── API routes ──────────────────────────────────────────────────────────────

app.use('/api/collections', apiLimiter, collectionsRouter);
app.use('/api/seasons', apiLimiter, seasonsRouter);
app.use('/api/episodes', apiLimiter, episodesRouter);
app.use('/api/videos', apiLimiter, videosRouter);
app.use('/api/download', downloadLimiter, downloadRouter);

// Auth routes (stricter rate limit — brute force protection)
app.use('/api/auth', authLimiter, authRouter);

// User-specific routes (requireAuth is applied inside userRouter)
app.use('/api/user', apiLimiter, userRouter);

// Admin routes — all require auth + admin role (enforced here, not repeated inside route files)
app.use('/api/admin/stats', apiLimiter, requireAuth, requireAdmin, statsRouter);
app.use('/api/admin/collections', apiLimiter, requireAuth, requireAdmin, adminCollectionsRouter);
app.use('/api/admin/seasons', apiLimiter, requireAuth, requireAdmin, adminSeasonsRouter);
app.use('/api/admin/episodes', apiLimiter, requireAuth, requireAdmin, adminEpisodesRouter);
app.use('/api/admin/videos', apiLimiter, requireAuth, requireAdmin, adminVideosRouter);
app.use('/api/admin/upload', apiLimiter, requireAuth, requireAdmin, adminUploadRouter);
app.use('/api/admin/users', apiLimiter, requireAuth, requireAdmin, adminUsersRouter);

// ─── Thumbnail static route (with security validation) ───────────────────────

const thumbnailsDir = path.resolve(process.cwd(), 'uploads', 'thumbnails');

app.get('/thumbnails/:filename', (req: Request, res: Response, next: NextFunction) => {
  const rawFilename = req.params['filename'] ?? '';

  // Reject any filename that contains path separators (prevents traversal)
  if (rawFilename.includes('/') || rawFilename.includes('\\') || rawFilename.includes('..')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  // path.basename as an additional layer in case the check above was bypassed
  const safeFilename = path.basename(rawFilename);
  const filePath = path.resolve(thumbnailsDir, safeFilename);

  // Belt-and-suspenders: confirm resolved path stays within thumbnailsDir
  if (!filePath.startsWith(thumbnailsDir + path.sep) && filePath !== thumbnailsDir) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Thumbnail not found' });
    return;
  }

  // Detect content type from extension
  const ext = path.extname(safeFilename).toLowerCase();
  const imageTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
  };
  const contentType = imageTypes[ext] ?? 'application/octet-stream';

  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'public, max-age=86400'); // 24-hour browser cache
  fs.createReadStream(filePath).pipe(res);
});

// ─── Health check ────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 + error handlers (must be last) ─────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`FanRangers API running on http://localhost:${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});

export default app;
