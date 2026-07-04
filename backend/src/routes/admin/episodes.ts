import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errors';
import { validateMaxLengths, isSafeHttpsUrl, uniqueConstraintError } from '../../lib/validation';

export const adminEpisodesRouter = Router();

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{1,20}$/;

// GET /api/admin/episodes?seasonId=X
adminEpisodesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seasonId } = req.query as { seasonId?: string };

    if (!seasonId || typeof seasonId !== 'string') {
      const err: AppError = new Error('seasonId query parameter is required');
      err.statusCode = 400;
      return next(err);
    }

    const episodes = await prisma.episode.findMany({
      where: { seasonId },
      orderBy: { number: 'asc' },
    });

    res.json(episodes);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/episodes
adminEpisodesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seasonId, number, title, synopsis, thumbnail, youtubeId, downloadLink, duration } =
      req.body as {
        seasonId?: string;
        number?: number;
        title?: string;
        synopsis?: string;
        thumbnail?: string;
        youtubeId?: string;
        downloadLink?: string;
        duration?: number;
      };

    if (!seasonId || typeof seasonId !== 'string') {
      const err: AppError = new Error('seasonId is required');
      err.statusCode = 400;
      return next(err);
    }
    if (number == null || typeof number !== 'number' || !Number.isInteger(number) || number < 1) {
      const err: AppError = new Error('number must be a positive integer');
      err.statusCode = 400;
      return next(err);
    }
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

    const episode = await prisma.episode.create({
      data: {
        seasonId,
        number,
        title: title.trim(),
        synopsis: synopsis?.trim() ?? null,
        thumbnail: thumbnail ?? null,
        youtubeId: youtubeId ?? null,
        downloadLink: downloadLink ?? null,
        duration: duration ?? null,
      },
    });

    res.status(201).json(episode);
  } catch (err) {
    const dup = uniqueConstraintError(
      err,
      'Ya existe un episodio con ese número en esta temporada. Usa un número distinto.',
    );
    next(dup ?? err);
  }
});

// PUT /api/admin/episodes/:id
adminEpisodesRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { number, title, synopsis, thumbnail, youtubeId, downloadLink, duration } =
      req.body as {
        number?: number;
        title?: string;
        synopsis?: string;
        thumbnail?: string;
        youtubeId?: string;
        downloadLink?: string | null;
        duration?: number;
      };

    const existing = await prisma.episode.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Episode not found');
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

    const episode = await prisma.episode.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(title !== undefined && { title: title.trim() }),
        ...(synopsis !== undefined && { synopsis: synopsis.trim() }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(youtubeId !== undefined && { youtubeId: youtubeId || null }),
        ...(downloadLink !== undefined && { downloadLink: downloadLink || null }),
        ...(duration !== undefined && { duration }),
      },
    });

    res.json(episode);
  } catch (err) {
    const dup = uniqueConstraintError(
      err,
      'Ya existe un episodio con ese número en esta temporada. Usa un número distinto.',
    );
    next(dup ?? err);
  }
});

// DELETE /api/admin/episodes/:id
adminEpisodesRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const existing = await prisma.episode.findUnique({ where: { id } });
    if (!existing) {
      const err: AppError = new Error('Episode not found');
      err.statusCode = 404;
      return next(err);
    }

    // Delete from DB (cascade deletes favorites, watchProgress)
    await prisma.episode.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
