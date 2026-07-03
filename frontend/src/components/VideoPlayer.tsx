import { useEffect, useRef, useCallback, useState } from 'react';
import { getFavorites, addFavorite, removeFavorite, saveProgress, getItemProgress } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  youtubeEmbedUrl,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_IFRAME_REFERRER_POLICY,
} from '../lib/youtube';

// Minimal YT IFrame API types
declare global {
  interface Window {
    YT: {
      // When `el` is an existing <iframe>, the video and player params come
      // from its src URL and `videoId`/`playerVars` are omitted.
      Player: new (
        el: HTMLElement,
        opts: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface VideoPlayerProps {
  youtubeId: string;
  downloadUrl?: string;
  title: string;
  contentId: string;
  contentType: 'episode' | 'video';
}

// Load YouTube IFrame API script once globally
let ytApiLoaded = false;
let ytApiCallbacks: Array<() => void> = [];

function loadYTApi(cb: () => void) {
  if (ytApiLoaded) { cb(); return; }
  ytApiCallbacks.push(cb);
  if (document.getElementById('yt-iframe-api')) return;
  const script = document.createElement('script');
  script.id = 'yt-iframe-api';
  script.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(script);
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiCallbacks.forEach((fn) => fn());
    ytApiCallbacks = [];
  };
}

export default function VideoPlayer({
  youtubeId,
  downloadUrl,
  title,
  contentId,
  contentType,
}: VideoPlayerProps) {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const resumeTimeRef = useRef<number>(0);
  const playerReadyRef = useRef<boolean>(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const favoriteIdRef = useRef<string | null>(null);

  // Load initial favorite state
  useEffect(() => {
    if (!isAuthenticated) { setIsFavorite(false); favoriteIdRef.current = null; return; }
    setIsFavorite(false);
    favoriteIdRef.current = null;
    getFavorites()
      .then((favs) => {
        const match = favs.find(
          (f) =>
            (contentType === 'episode' && f.episode?.id === contentId) ||
            (contentType === 'video' && f.video?.id === contentId)
        );
        if (match) { setIsFavorite(true); favoriteIdRef.current = match.id; }
      })
      .catch(() => {});
  }, [contentId, contentType, isAuthenticated]);

  // Fetch saved progress to resume playback
  useEffect(() => {
    resumeTimeRef.current = 0;
    playerReadyRef.current = false;
    if (!isAuthenticated) return;

    getItemProgress(contentType === 'episode' ? 'episode' : 'video', contentId)
      .then((p) => {
        if (!p || p.duration <= 0) return;
        const ratio = p.currentTime / p.duration;
        if (ratio < 0.02 || ratio >= 0.95) return;
        resumeTimeRef.current = p.currentTime;
        // If the player already fired onReady before this response arrived, seek now
        if (playerReadyRef.current && playerRef.current) {
          playerRef.current.seekTo(p.currentTime, true);
        }
      })
      .catch(() => {});
  }, [contentId, contentType, isAuthenticated]);

  const flushProgress = useCallback(() => {
    if (!isAuthenticated || !playerRef.current || !playerReadyRef.current) return;
    const player = playerRef.current;
    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();
    if (!duration || isNaN(duration) || duration <= 0) return;
    const body = contentType === 'episode'
      ? { episodeId: contentId, currentTime, duration }
      : { videoId: contentId, currentTime, duration };
    saveProgress(body).catch(() => {});
  }, [isAuthenticated, contentId, contentType]);

  // Keep a ref always pointing to the latest flushProgress so the player
  // callbacks never close over a stale version.
  const flushProgressRef = useRef(flushProgress);
  flushProgressRef.current = flushProgress;

  // Initialize YouTube player
  useEffect(() => {
    let destroyed = false;

    loadYTApi(() => {
      if (destroyed || !containerRef.current) return;

      // Build the <iframe> ourselves instead of letting YT.Player create it:
      // YouTube now requires a valid Referer on embeds (error 153), and the
      // referrerpolicy/allow attributes must be set BEFORE the embed loads.
      // The youtube-nocookie host reduces cookie/referrer-related failures.
      const iframe = document.createElement('iframe');
      iframe.src = youtubeEmbedUrl(youtubeId, {
        enablejsapi: '1',
        rel: '0',
        modestbranding: '1',
        origin: window.location.origin,
      });
      iframe.className = 'w-full h-full';
      iframe.title = title;
      iframe.setAttribute('allow', YOUTUBE_IFRAME_ALLOW);
      iframe.setAttribute('referrerpolicy', YOUTUBE_IFRAME_REFERRER_POLICY);
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('frameborder', '0');
      containerRef.current.appendChild(iframe);
      iframeRef.current = iframe;

      playerRef.current = new window.YT.Player(iframe, {
        events: {
          onReady: (e) => {
            playerReadyRef.current = true;
            if (resumeTimeRef.current > 2) {
              e.target.seekTo(resumeTimeRef.current, true);
            }
          },
          onStateChange: (e) => {
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (e.data === PLAYING) {
              progressTimerRef.current = setInterval(() => {
                const p = playerRef.current;
                if (!p) return;
                const ct = p.getCurrentTime();
                if (ct - lastSavedTimeRef.current >= 10) {
                  lastSavedTimeRef.current = ct;
                  flushProgressRef.current();
                }
              }, 5000);
            } else if (e.data === PAUSED || e.data === ENDED) {
              if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
                progressTimerRef.current = null;
              }
              flushProgressRef.current();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      playerReadyRef.current = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      flushProgressRef.current();
      playerRef.current?.destroy();
      playerRef.current = null;
      // The iframe lives inside the React-owned container div (which YT never
      // replaces, since we hand it an existing iframe). destroy() removes the
      // iframe; if the player never initialized, remove it ourselves.
      if (iframeRef.current?.isConnected) {
        iframeRef.current.remove();
      }
      iframeRef.current = null;
    };
  }, [youtubeId, title]);

  // Reset saved time ref when content changes
  useEffect(() => {
    lastSavedTimeRef.current = 0;
  }, [contentId]);

  async function handleToggleFavorite() {
    if (!isAuthenticated || favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorite && favoriteIdRef.current) {
        await removeFavorite(favoriteIdRef.current);
        favoriteIdRef.current = null;
        setIsFavorite(false);
      } else {
        const body = contentType === 'episode' ? { episodeId: contentId } : { videoId: contentId };
        const newFav = await addFavorite(body);
        favoriteIdRef.current = newFav.id;
        setIsFavorite(true);
      }
    } catch {
      // Silent failure
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* YouTube embed container */}
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Controls row: favorite */}
      <div className="mt-4 flex flex-wrap items-center gap-3 justify-end">
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favLoading}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1E2840] text-sm transition-all duration-150 hover:border-[#E8430A]/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4 h-4 transition-colors ${isFavorite ? 'text-[#E8430A] fill-[#E8430A]' : 'text-[#8085A0] fill-none'}`}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className={isFavorite ? 'text-[#E8430A]' : 'text-[#8085A0]'}>
              {isFavorite ? 'Favorito' : 'Agregar'}
            </span>
          </button>
        )}
      </div>

      {/* Download button — only if downloadUrl is provided */}
      {downloadUrl && (
        <div className="mt-3">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#1E2840] bg-[#0F1220] text-[#8085A0] text-sm hover:border-[#E8430A]/50 hover:text-[#E8DAC0] transition-all duration-150"
            aria-label={`Descargar: ${title}`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3" />
            </svg>
            Descargar
          </a>
        </div>
      )}

    </div>
  );
}
