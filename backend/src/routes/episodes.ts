import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';

export const episodesRouter = Router();

/**
 * GET /api/episodes/:id
 * Returns full episode with youtubeId, downloadLink and parent season + collection.
 */
episodesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const episode = await prisma.episode.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        title: true,
        synopsis: true,
        thumbnail: true,
        duration: true,
        youtubeId: true,
        downloadLink: true,
        season: {
          select: {
            id: true,
            number: true,
            collection: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!episode) {
      const err: AppError = new Error('Episode not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json(episode);
  } catch (err) {
    next(err);
  }
});
