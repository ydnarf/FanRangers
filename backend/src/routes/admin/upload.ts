import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { createUploader } from '../../middleware/upload';
import { isAllowedImage } from '../../lib/fileSignature';

export const adminUploadRouter = Router();

const handleMulterError = (err: unknown, res: Response, next: NextFunction): void => {
  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

// POST /api/admin/upload/thumbnail
adminUploadRouter.post(
  '/thumbnail',
  (req: Request, res: Response, next: NextFunction) => {
    const uploader = createUploader('thumbnail').single('file');
    uploader(req, res, (err) => {
      if (err) {
        handleMulterError(err, res, next);
        return;
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
      return;
    }
    // Verify real file bytes match an allowed image format (thumbnails are
    // served publicly, so a spoofed Content-Type could otherwise host a payload
    // on our origin — finding M1).
    if (!isAllowedImage(file.path)) {
      fs.unlink(file.path, () => {});
      res.status(400).json({ error: 'File content does not match an allowed image type.' });
      return;
    }
    res.status(201).json({ filename: file.filename });
  },
);
