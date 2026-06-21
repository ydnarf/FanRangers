import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errors';
import { validateMaxLengths, isSafeHttpsUrl } from '../../lib/validation';

export const adminVideosRouter = Router();

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{1,20}$/;

// GET /api/admin/videos
adminVideosRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { title: 'asc' },
      include: {
        collection: { select: { id: true, title: true } },
      },
    });
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/videos
adminVideosRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, synopsis, thumbnail, youtubeId, downloadLink, collectionId, duration, featured } =
      req.body as {
        title?: string;
        synopsis?: string;
        thumbnail?: string;
        youtubeId?: string;
        downloadLink?: string;
        collectionId?: string;
        duration?: number;
        featured?: boolean;
      };

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      const err: AppError = new Error('title is required and must be a non-empty string');
      err.statusCode = 400;
      return next(err);
    }
    if (youtubeId !== undefined && youtubeId !== null && youtubeId !== '') {
      if (typeof youtubeId !== 'string' || !YOUTUBE_ID_RE.test(youtubeId)) {
        const err: AppError = new Error('youtubeId must contain only alphanumeric characters, hyphens, or underscores (max 20 chars)');
        err.statusCode = 400;
        return next(err);
      }
    }
    if (downloadLink !== undefined && downloadLink !== null && downloadLink !== '') {
      if (typeof downloadLink !== 'string' || !isSafeHttpsUrl(downloadLink)) {
        const err: AppError = new Error('downloadLink must be a valid https:// URL');
        err.statusCode = 400;
        return next(err);
      }
    }

    const lengthErr = validateMaxLengths([
      { name: 'title', value: title, max: 200 },
      { name: 'synopsis', value: synopsis, max: 2000 },
      { name: 'thumbnail', value: thumbnail, max: 500 },
      { name: 'downloadLink', value: downloadLink, max: 2048 },
    ]);
    if (lengthErr) return next(lengthErr);

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        synopsis: synopsis?.trim() ?? null,
        thumbnail: thumbnail ?? null,
        youtubeId: youtubeId ?? null,
        downloadLink: downloadLink ?? null,
        collectionId: collectionId ?? null,
        duration: duration ?? null,
        featured: featured ?? false,
      },
    });

    res.status(201).json(video);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/videos/:id
adminVideosRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { title, synopsis, thumbnail, youtubeId, downloadLink, collectionId, duration, featured } =
      req.body as {
        title?: string;
        synopsis?: string;
        thumbnail?: string;
        youtubeId?: string;
        downloadLink?: string;
        collectionId?: string | null;
        duration?: number;
        featured?: boolean;
      };

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Video not found');
      err.statusCode = 404;
      return next(err);
    }

    if (youtubeId !== undefined && youtubeId !== null && youtubeId !== '') {
      if (typeof youtubeId !== 'string' || !YOUTUBE_ID_RE.test(youtubeId)) {
        const err: AppError = new Error('youtubeId must contain only alphanumeric characters, hyphens, or underscores (max 20 chars)');
        err.statusCode = 400;
        return next(err);
      }
    }
    if (downloadLink !== undefined && downloadLink !== null && downloadLink !== '') {
      if (typeof downloadLink !== 'string' || !isSafeHttpsUrl(downloadLink)) {
        const err: AppError = new Error('downloadLink must be a valid https:// URL');
        err.statusCode = 400;
        return next(err);
      }
    }

    const lengthErr = validateMaxLengths([
      { name: 'title', value: title, max: 200 },
      { name: 'synopsis', value: synopsis, max: 2000 },
      { name: 'thumbnail', value: thumbnail, max: 500 },
      { name: 'downloadLink', value: downloadLink, max: 2048 },
    ]);
    if (lengthErr) return next(lengthErr);

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(synopsis !== undefined && { synopsis: synopsis.trim() }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(youtubeId !== undefined && { youtubeId: youtubeId || null }),
        ...(downloadLink !== undefined && { downloadLink: downloadLink || null }),
        ...(collectionId !== undefined && { collectionId }),
        ...(duration !== undefined && { duration }),
        ...(featured !== undefined && { featured }),
      },
    });

    res.json(video);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/videos/:id
adminVideosRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Video not found');
      err.statusCode = 404;
      return next(err);
    }

    // Delete from DB (cascade deletes favorites, watchProgress)
    await prisma.video.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
