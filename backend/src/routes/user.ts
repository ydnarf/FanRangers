import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';
import { requireAuth } from '../middleware/auth';

export const userRouter = Router();

// All user routes require authentication
userRouter.use(requireAuth);

// GET /api/user/favorites
userRouter.get('/favorites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.userId },
      include: {
        episode: {
          select: {
            id: true,
            number: true,
            title: true,
            thumbnail: true,
            season: {
              select: {
                id: true,
                number: true,
                collection: { select: { id: true, title: true } },
              },
            },
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

// POST /api/user/favorites
userRouter.post('/favorites', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { episodeId, videoId } = req.body as { episodeId?: string; videoId?: string };

    if (!episodeId && !videoId) {
      const err: AppError = new Error('episodeId or videoId is required');
      err.statusCode = 400;
      return next(err);
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user!.userId,
        episodeId: episodeId ?? null,
        videoId: videoId ?? null,
      },
      select: { id: true },
    });

    res.status(201).json(favorite);
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === 'P2002') {
      res.status(409).json({ error: 'Already in favorites' });
    } else {
      next(err);
    }
  }
});

// DELETE /api/user/favorites/:id
userRouter.delete('/favorites/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fav = await prisma.favorite.findFirst({
      where: { id: req.params['id'], userId: req.user!.userId },
    });

    if (!fav) {
      const err: AppError = new Error('Not found');
      err.statusCode = 404;
      return next(err);
    }

    await prisma.favorite.delete({ where: { id: fav.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/user/progress
userRouter.get('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await prisma.watchProgress.findMany({
      where: { userId: req.user!.userId },
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            number: true,
            season: {
              select: {
                id: true,
                number: true,
                collection: { select: { id: true, title: true } },
              },
            },
          },
        },
        video: {
          select: { id: true, title: true, thumbnail: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    res.json(progress);
  } catch (err) {
    next(err);
  }
});

// GET /api/user/progress/episode/:episodeId
userRouter.get('/progress/episode/:episodeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await prisma.watchProgress.findUnique({
      where: { userId_episodeId: { userId: req.user!.userId, episodeId: req.params['episodeId'] } },
      select: { currentTime: true, duration: true },
    });
    res.json(progress ?? null);
  } catch (err) {
    next(err);
  }
});

// GET /api/user/progress/video/:videoId
userRouter.get('/progress/video/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await prisma.watchProgress.findUnique({
      where: { userId_videoId: { userId: req.user!.userId, videoId: req.params['videoId'] } },
      select: { currentTime: true, duration: true },
    });
    res.json(progress ?? null);
  } catch (err) {
    next(err);
  }
});

// POST /api/user/progress (upsert)
userRouter.post('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { episodeId, videoId, currentTime, duration } = req.body as {
      episodeId?: string;
      videoId?: string;
      currentTime?: number;
      duration?: number;
    };

    if ((!episodeId && !videoId) || currentTime == null || duration == null) {
      const err: AppError = new Error(
        'episodeId or videoId, currentTime and duration are required',
      );
      err.statusCode = 400;
      return next(err);
    }

    // Validate numeric range — reject NaN/Infinity/negatives and currentTime
    // beyond duration so a client can't corrupt its own progress (finding M5).
    const ct = Number(currentTime);
    const dur = Number(duration);
    if (!Number.isFinite(ct) || ct < 0 || !Number.isFinite(dur) || dur <= 0 || ct > dur) {
      const err: AppError = new Error(
        'currentTime and duration must be finite numbers with 0 <= currentTime <= duration',
      );
      err.statusCode = 400;
      return next(err);
    }

    const userId = req.user!.userId;
    const data = { currentTime: ct, duration: dur };

    let progress;

    if (episodeId) {
      progress = await prisma.watchProgress.upsert({
        where: { userId_episodeId: { userId, episodeId } },
        update: data,
        create: { userId, episodeId, videoId: null, ...data },
      });
    } else {
      progress = await prisma.watchProgress.upsert({
        where: { userId_videoId: { userId, videoId: videoId! } },
        update: data,
        create: { userId, videoId: videoId!, episodeId: null, ...data },
      });
    }

    res.json({ id: progress.id });
  } catch (err) {
    next(err);
  }
});
