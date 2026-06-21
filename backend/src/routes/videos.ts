import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';

export const videosRouter = Router();

const VIDEO_SELECT = {
  id: true,
  title: true,
  synopsis: true,
  thumbnail: true,
  duration: true,
  featured: true,
  youtubeId: true,
  downloadLink: true,
  collection: { select: { id: true, title: true, type: true } },
} as const;

/**
 * GET /api/videos
 * Returns all standalone videos ordered by creation date (newest first).
 */
videosRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const videos = await prisma.video.findMany({
      select: VIDEO_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/videos/:id
 * Returns standalone video with youtubeId, downloadLink and parent collection if any.
 */
videosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: VIDEO_SELECT,
    });

    if (!video) {
      const err: AppError = new Error('Video not found');
      err.statusCode = 404;
      return next(err);
    }

    res.json(video);
  } catch (err) {
    next(err);
  }
});
