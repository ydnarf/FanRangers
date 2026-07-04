import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';

export const seasonsRouter = Router();

/**
 * GET /api/seasons/:id
 * Returns season with its episodes (ordered by number ASC) and parent collection.
 */
seasonsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const season = await prisma.season.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        collection: {
          select: {
            id: true,
            title: true,
          },
        },
        episodes: {
          orderBy: { number: 'asc' },
          select: {
            id: true,
            number: true,
            title: true,
            synopsis: true,
            thumbnail: true,
            youtubeId: true,
            duration: true,
          },
        },
      },
    });

    if (!season) {
      const err: AppError = new Error('Season not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json(season);
  } catch (err) {
    next(err);
  }
});
