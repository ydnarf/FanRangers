import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errors';
import { optionalAuth } from '../middleware/auth';
import { shortenUrl } from '../lib/shortener';
import { isSafeHttpsUrl } from '../lib/validation';

export const downloadRouter = Router();

// Resolve the download URL for a given direct link:
// - PREMIUM / ADMIN users get the direct link with no shortener.
// - Everyone else goes through the shortener (they see shortener ads).
async function resolveDownloadUrl(
  directLink: string | null | undefined,
  isPremium: boolean,
): Promise<string | null> {
  if (!directLink) return null;
  if (!isSafeHttpsUrl(directLink)) return null;
  if (isPremium) return directLink;
  return shortenUrl(directLink);
}

async function handleDownload(
  directLink: string | null | undefined,
  isPremium: boolean,
  res: Response,
  next: NextFunction,
) {
  if (!directLink) {
    const err: AppError = new Error('No download link available for this content');
    err.statusCode = 404;
    return next(err);
  }

  if (!isSafeHttpsUrl(directLink)) {
    const err: AppError = new Error('Invalid download link');
    err.statusCode = 500;
    return next(err);
  }

  try {
    const redirectUrl = await resolveDownloadUrl(directLink, isPremium) ?? directLink;
    res.redirect(302, redirectUrl);
  } catch (err) {
    next(err);
  }
}

// GET /api/download/episode/:id
downloadRouter.get('/episode/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const episode = await prisma.episode.findUnique({
      where: { id: req.params['id'] },
      select: { downloadLink: true },
    });
    if (!episode) {
      const err: AppError = new Error('Episode not found');
      err.statusCode = 404;
      return next(err);
    }
    const isPremium = req.user?.role === 'PREMIUM' || req.user?.role === 'ADMIN';
    await handleDownload(episode.downloadLink, isPremium, res, next);
  } catch (err) {
    next(err);
  }
});

// GET /api/download/video/:id
downloadRouter.get('/video/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params['id'] },
      select: { downloadLink: true },
    });
    if (!video) {
      const err: AppError = new Error('Video not found');
      err.statusCode = 404;
      return next(err);
    }
    const isPremium = req.user?.role === 'PREMIUM' || req.user?.role === 'ADMIN';
    await handleDownload(video.downloadLink, isPremium, res, next);
  } catch (err) {
    next(err);
  }
});
