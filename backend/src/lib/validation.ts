import { AppError } from '../middleware/errors';

/**
 * Validates that a URL is a safe https:// URL using the URL parser.
 * Rejects: non-https protocols, embedded credentials, CRLF in any component.
 * The URL constructor throws on control characters, eliminating CRLF injection.
 */
export function isSafeHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.username === '' && u.password === '';
  } catch {
    return false;
  }
}

/**
 * Validates that the given string fields do not exceed their maximum length.
 * Only validates fields whose value is a string (undefined/null are skipped,
 * so this works for both create and partial-update payloads).
 *
 * Returns an AppError (statusCode 400) on the first violation, or null if all
 * provided fields are within their limits.
 */
export function validateMaxLengths(
  fields: Array<{ name: string; value: unknown; max: number }>,
): AppError | null {
  for (const { name, value, max } of fields) {
    if (typeof value === 'string' && value.length > max) {
      const err: AppError = new Error(`${name} must be at most ${max} characters`);
      err.statusCode = 400;
      return err;
    }
  }
  return null;
}

/**
 * Detects a Prisma unique-constraint violation (error code P2002) and, when
 * found, returns a friendly AppError (409 Conflict) carrying the given message.
 * Returns null for any other error so callers can do `next(dup ?? err)` and let
 * unrelated failures fall through to the generic error handler.
 *
 * Without this, a duplicate (seasonId, number) / (collectionId, number) insert
 * surfaces as an opaque 500 ("Internal server error" in production) and the row
 * silently fails to save.
 */
export function uniqueConstraintError(err: unknown, message: string): AppError | null {
  if (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  ) {
    const e: AppError = new Error(message);
    e.statusCode = 409;
    return e;
  }
  return null;
}
