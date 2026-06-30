import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

/**
 * Idempotent startup bootstrap: create the initial ADMIN user from the
 * ADMIN_EMAIL / ADMIN_PASSWORD env vars if it doesn't already exist.
 *
 * Unlike `prisma/seed.ts` (which deletes content before inserting demo data and
 * must be run manually), this only *creates* the admin when missing, so it is
 * safe to run on every startup — important on hosts without shell access
 * (e.g. Render's free tier) where the seed cannot be run by hand.
 */
export async function ensureAdminUser(): Promise<void> {
  const email = process.env['ADMIN_EMAIL'];
  const password = process.env['ADMIN_PASSWORD'];

  if (!email || !password) {
    console.warn('[bootstrap] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin creation.');
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`[bootstrap] Admin user already exists: ${email}`);
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, password: hash, name: 'Admin', role: 'ADMIN' },
    });
    console.log(`[bootstrap] Admin user created: ${email}`);
  } catch (err) {
    // Never crash the server because of bootstrap; just log it.
    console.error('[bootstrap] Failed to ensure admin user:', err);
  }
}
