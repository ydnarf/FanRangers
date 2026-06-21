import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errors';

export const adminUsersRouter = Router();

// GET / — List all users ordered by createdAt DESC
adminUsersRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// PUT /:id/role — Change a user's role (FREE or PREMIUM only)
adminUsersRouter.put('/:id/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: unknown };

    // Validate incoming role — ADMIN promotion is intentionally excluded
    if (role !== 'FREE' && role !== 'PREMIUM') {
      const err: AppError = new Error('Role must be FREE or PREMIUM');
      err.statusCode = 422;
      return next(err);
    }

    // Admin cannot change their own role
    if (req.user!.userId === id) {
      const err: AppError = new Error('Admins cannot change their own role');
      err.statusCode = 403;
      return next(err);
    }

    // Fetch target user to enforce business rules
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!target) {
      const err: AppError = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    // Admin cannot change another admin's role
    if (target.role === 'ADMIN') {
      const err: AppError = new Error('Cannot change the role of another admin');
      err.statusCode = 403;
      return next(err);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});
