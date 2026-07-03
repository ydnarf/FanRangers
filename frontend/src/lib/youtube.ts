/**
 * Extracts the YouTube video ID from a URL or bare ID, discarding any query
 * parameters (e.g. tracking params like `?si=`). Supports:
 *   - bare IDs ("Wj-q428tgFo")
 *   - youtube.com/watch?v=ID
 *   - youtube.com/embed/ID
 *   - youtube.com/shorts/ID and /live/ID
 *   - youtu.be/ID
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{1,20}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/** Attributes YouTube requires on embed iframes to avoid error 153. */
export const YOUTUBE_IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

export const YOUTUBE_IFRAME_REFERRER_POLICY = 'strict-origin-when-cross-origin';

/** Privacy-enhanced embed URL (youtube-nocookie reduces cookie/referrer failures). */
export function youtubeEmbedUrl(videoId: string, params?: Record<string, string>): string {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return `https://www.youtube-nocookie.com/embed/${videoId}${query}`;
}
