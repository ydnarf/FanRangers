import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';

export const collectionsRouter = Router();

/**
 * GET /api/collections
 * Returns all collections ordered by featured DESC, title ASC.
 */
collectionsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: [{ featured: 'desc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        type: true,
        featured: true,
        _count: {
          select: {
            seasons: true,
            videos: true,
          },
        },
      },
    });

    res.json(collections);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/collections/:id
 * Returns single collection with nested seasons and standalone videos.
 */
collectionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        heroImage: true,
        type: true,
        featured: true,
        seasons: {
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            description: true,
            _count: {
              select: { episodes: true },
            },
          },
        },
        videos: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            synopsis: true,
            thumbnail: true,
          },
        },
      },
    });

    if (!collection) {
      const err: AppError = new Error('Collection not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json(collection);
  } catch (err) {
    next(err);
  }
});
