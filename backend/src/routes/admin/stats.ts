import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';

export const statsRouter = Router();

// GET /api/admin/stats
// Returns counts for collections, seasons, episodes, videos, users
statsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [collections, seasons, episodes, videos, users] = await prisma.$transaction([
      prisma.collection.count(),
      prisma.season.count(),
      prisma.episode.count(),
      prisma.video.count(),
      prisma.user.count(),
    ]);

    res.json({ collections, seasons, episodes, videos, users });
  } catch (err) {
    next(err);
  }
});
