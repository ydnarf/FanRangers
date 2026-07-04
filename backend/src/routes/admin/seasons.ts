import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errors';
import { uniqueConstraintError } from '../../lib/validation';

export const adminSeasonsRouter = Router();

// GET /api/admin/seasons?collectionId=X
adminSeasonsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collectionId } = req.query as { collectionId?: string };

    if (!collectionId || typeof collectionId !== 'string') {
      const err: AppError = new Error('collectionId query parameter is required');
      err.statusCode = 400;
      return next(err);
    }

    const seasons = await prisma.season.findMany({
      where: { collectionId },
      include: {
        _count: { select: { episodes: true } },
      },
      orderBy: { number: 'asc' },
    });

    res.json(seasons);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/seasons
adminSeasonsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collectionId, number, title, description } = req.body as {
      collectionId?: string;
      number?: number;
      title?: string;
      description?: string;
    };

    if (!collectionId || typeof collectionId !== 'string') {
      const err: AppError = new Error('collectionId is required');
      err.statusCode = 400;
      return next(err);
    }
    if (number == null || typeof number !== 'number' || !Number.isInteger(number) || number < 1) {
      const err: AppError = new Error('number must be a positive integer');
      err.statusCode = 400;
      return next(err);
    }

    const season = await prisma.season.create({
      data: {
        collectionId,
        number,
        title: title?.trim() ?? null,
        description: description?.trim() ?? null,
      },
    });

    res.status(201).json(season);
  } catch (err) {
    const dup = uniqueConstraintError(
      err,
      'Ya existe una temporada con ese número en esta colección. Usa un número distinto.',
    );
    next(dup ?? err);
  }
});

// PUT /api/admin/seasons/:id
adminSeasonsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { number, title, description } = req.body as {
      number?: number;
      title?: string;
      description?: string;
    };

    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Season not found');
      err.statusCode = 404;
      return next(err);
    }

    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
    });

    res.json(season);
  } catch (err) {
    const dup = uniqueConstraintError(
      err,
      'Ya existe una temporada con ese número en esta colección. Usa un número distinto.',
    );
    next(dup ?? err);
  }
});

// DELETE /api/admin/seasons/:id
adminSeasonsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Season not found');
      err.statusCode = 404;
      return next(err);
    }

    // Cascade deletes episodes via Prisma schema relations
    await prisma.season.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
