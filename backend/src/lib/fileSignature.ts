import fs from 'fs';

// Magic-byte (file signature) validation. The Multer fileFilter only sees the
// client-supplied Content-Type, which is trivially spoofable. For files served
// back to browsers (thumbnails), we additionally verify the real bytes so an
// attacker can't upload e.g. an HTML/JS payload disguised as image/png and get
// it served from our origin (finding M1).

type SignatureCheck = (buf: Buffer, bytesRead: number) => boolean;

const ascii = (buf: Buffer, start: number, end: number): string =>
  buf.toString('ascii', start, Math.min(end, buf.length));

// Signatures for the thumbnail types allowed in upload.ts: jpeg, png, webp, avif.
const IMAGE_SIGNATURES: SignatureCheck[] = [
  // JPEG: FF D8 FF
  (b, n) => n >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  (b, n) =>
    n >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  // WebP: "RIFF" .... "WEBP"
  (b, n) => n >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  // AVIF (ISOBMFF): "ftyp" box at offset 4 with an "avif" brand in the header
  (b, n) => n >= 12 && ascii(b, 4, 8) === 'ftyp' && ascii(b, 8, 32).includes('avif'),
];

// Returns true only if the file's leading bytes match an allowed image format.
export function isAllowedImage(filePath: string): boolean {
  let fd: number | undefined;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(32);
    const bytesRead = fs.readSync(fd, buf, 0, 32, 0);
    return IMAGE_SIGNATURES.some((check) => check(buf, bytesRead));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}
