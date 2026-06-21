import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errors';
import { validateMaxLengths } from '../../lib/validation';

export const adminCollectionsRouter = Router();

// GET /api/admin/collections
adminCollectionsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        _count: { select: { seasons: true, videos: true } },
      },
      orderBy: { title: 'asc' },
    });
    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/collections
adminCollectionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, type, featured, coverImage, heroImage } = req.body as {
      title?: string;
      description?: string;
      type?: string;
      featured?: boolean;
      coverImage?: string;
      heroImage?: string;
    };

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      const err: AppError = new Error('title is required and must be a non-empty string');
      err.statusCode = 400;
      return next(err);
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      const err: AppError = new Error('description is required and must be a non-empty string');
      err.statusCode = 400;
      return next(err);
    }

    const lengthErr = validateMaxLengths([
      { name: 'title', value: title, max: 200 },
      { name: 'description', value: description, max: 2000 },
    ]);
    if (lengthErr) return next(lengthErr);

    const validTypes = ['SERIES', 'FILMS'];
    const resolvedType =
      type && validTypes.includes(type) ? (type as 'SERIES' | 'FILMS') : 'SERIES';

    const collection = await prisma.collection.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        type: resolvedType,
        featured: featured ?? false,
        coverImage: coverImage ?? null,
        heroImage: heroImage ?? null,
      },
    });

    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/collections/:id
adminCollectionsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { title, description, type, featured, coverImage, heroImage } = req.body as {
      title?: string;
      description?: string;
      type?: string;
      featured?: boolean;
      coverImage?: string;
      heroImage?: string;
    };

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Collection not found');
      err.statusCode = 404;
      return next(err);
    }

    const lengthErr = validateMaxLengths([
      { name: 'title', value: title, max: 200 },
      { name: 'description', value: description, max: 2000 },
    ]);
    if (lengthErr) return next(lengthErr);

    const validTypes = ['SERIES', 'FILMS'];
    const resolvedType =
      type && validTypes.includes(type) ? (type as 'SERIES' | 'FILMS') : undefined;

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(resolvedType !== undefined && { type: resolvedType }),
        ...(featured !== undefined && { featured }),
        ...(coverImage !== undefined && { coverImage }),
        ...(heroImage !== undefined && { heroImage }),
      },
    });

    res.json(collection);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/collections/:id
adminCollectionsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Collection not found');
      err.statusCode = 404;
      return next(err);
    }

    // Cascade deletes seasons + episodes via Prisma schema relations
    await prisma.collection.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
