import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import crypto from 'crypto';

type UploadType = 'video' | 'thumbnail' | 'audio';

const ALLOWED_TYPES: Record<UploadType, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'video/mp4'],
  thumbnail: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
};

const SIZE_LIMITS: Record<UploadType, number> = {
  video: 4 * 1024 * 1024 * 1024,  // 4 GB
  audio: 500 * 1024 * 1024,        // 500 MB
  thumbnail: 10 * 1024 * 1024,     // 10 MB
};

const UPLOAD_DIRS: Record<UploadType, string> = {
  video: 'uploads/videos',
  audio: 'uploads/audio',
  thumbnail: 'uploads/thumbnails',
};

const EXT_MAP: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/x-matroska': '.mkv',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

export function createUploader(type: UploadType) {
  // Ensure the target directory exists. On ephemeral hosts (e.g. Render's free
  // tier) the uploads/ tree is wiped on each deploy, so create it on demand.
  fs.mkdirSync(UPLOAD_DIRS[type], { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIRS[type]),
    filename: (_req, file, cb) => {
      const randomHex = crypto.randomBytes(16).toString('hex');
      const ext = EXT_MAP[file.mimetype] ?? path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${randomHex}${ext}`);
    },
  });

  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (ALLOWED_TYPES[type].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${type}: ${file.mimetype}`));
    }
  };

  return multer({ storage, fileFilter, limits: { fileSize: SIZE_LIMITS[type] } });
}
