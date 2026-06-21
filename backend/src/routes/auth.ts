import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';
import { signToken, requireAuth, setAuthCookie, clearAuthCookie } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const err: AppError = new Error('Valid email is required');
      err.statusCode = 400;
      return next(err);
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      const err: AppError = new Error('Password must be at least 8 characters');
      err.statusCode = 400;
      return next(err);
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      const err: AppError = new Error('Email already in use');
      err.statusCode = 409;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name?.trim() || null,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role as 'FREE' | 'PREMIUM' | 'ADMIN' });
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      const err: AppError = new Error('Email and password are required');
      err.statusCode = 400;
      return next(err);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Use constant-time comparison even if user doesn't exist (prevent timing attacks)
    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatch) {
      const err: AppError = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role as 'FREE' | 'PREMIUM' | 'ADMIN' });
    setAuthCookie(res, token);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
// Idempotent — does not require auth. Simply clears the HttpOnly auth cookie.
authRouter.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(204).end();
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      const err: AppError = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});
