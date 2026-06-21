import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import AdSlot from '../components/AdSlot';
import { useAuth } from '../context/AuthContext';
import {
  getEpisode,
  getVideo,
  getEpisodeDownloadUrl,
  getVideoDownloadUrl,
} from '../lib/api';
import type { Episode, Video } from '../types';

interface PlayerPageProps {
  type: 'episode' | 'video';
}

type MediaData =
  | { kind: 'episode'; data: Episode }
  | { kind: 'video'; data: Video };

interface PageState {
  media: MediaData | null;
  loading: boolean;
  error: string | null;
}

export default function PlayerPage({ type }: PlayerPageProps) {
  const { id } = useParams<{ id: string }>();
  const { isPremium } = useAuth();
  const [state, setState] = useState<PageState>({
    media: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setState({ media: null, loading: true, error: null });

    const fetchFn = type === 'episode' ? getEpisode(id) : getVideo(id);

    fetchFn
      .then((data) => {
        if (!cancelled) {
          const media: MediaData =
            type === 'episode'
              ? { kind: 'episode', data: data as Episode }
              : { kind: 'video', data: data as Video };
          setState({ media, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error al cargar el video';
          setState({ media: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, type]);

  const { media, loading, error } = state;

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#8085A0] mb-6 flex-wrap" aria-label="Ruta de navegacion">
          <Link to="/" className="hover:text-[#E8DAC0] transition-colors">
            Inicio
          </Link>
          {media && <Breadcrumb media={media} />}
        </nav>

        {/* AdSense — above player, only for non-premium visitors */}
        <AdSlot id="adsense-player-top" className="mb-6" />

        {loading ? (
          <PlayerSkeleton />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !media ? (
          <NotFound type={type} />
        ) : (
          <PlayerContent media={media} id={id} type={type} isPremium={isPremium} />
        )}
      </div>
    </main>
  );
}

function Breadcrumb({ media }: { media: MediaData }) {
  if (media.kind === 'episode') {
    const season = media.data.season;
    if (!season) return null;
    return (
      <>
        <span aria-hidden="true">&rsaquo;</span>
        <Link
          to={`/collection/${season.collection.id}`}
          className="hover:text-[#E8DAC0] transition-colors"
        >
          {season.collection.title}
        </Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link
          to={`/season/${season.id}`}
          className="hover:text-[#E8DAC0] transition-colors"
        >
          Temporada {season.number}
        </Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="text-[#E8DAC0]">
          Ep. {media.data.number}: {media.data.title}
        </span>
      </>
    );
  }

  const collection = media.data.collection;
  return (
    <>
      {collection && (
        <>
          <span aria-hidden="true">&rsaquo;</span>
          <Link
            to={`/collection/${collection.id}`}
            className="hover:text-[#E8DAC0] transition-colors"
          >
            {collection.title}
          </Link>
        </>
      )}
      <span aria-hidden="true">&rsaquo;</span>
      <span className="text-[#E8DAC0]">{media.data.title}</span>
    </>
  );
}

function PlayerContent({
  media,
  id,
  type,
  isPremium,
}: {
  media: MediaData;
  id: string | undefined;
  type: 'episode' | 'video';
  isPremium: boolean;
}) {
  const title = media.kind === 'episode'
    ? `Ep. ${media.data.number}: ${media.data.title}`
    : media.data.title;

  const synopsis = media.data.synopsis;
  const duration = media.data.duration;
  const youtubeId = media.data.youtubeId;
  const hasDownload = Boolean(media.data.downloadLink);

  // Premium users get a direct link to the file (no shortener, no ads).
  // Everyone else goes through the backend download endpoint (shortener applies).
  const downloadUrl = hasDownload && id
    ? isPremium
      ? (media.data.downloadLink ?? undefined)
      : (type === 'episode' ? getEpisodeDownloadUrl(id) : getVideoDownloadUrl(id))
    : undefined;

  return (
    <article>
      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#E8DAC0] mb-6">
        {title}
      </h1>

      {youtubeId ? (
        <VideoPlayer
          youtubeId={youtubeId}
          downloadUrl={downloadUrl}
          title={title}
          contentId={media.data.id}
          contentType={media.kind}
        />
      ) : (
        <VideoUnavailable />
      )}

      <div className="mt-8 space-y-4">
        {duration !== null && duration !== undefined && (
          <p className="text-[#8085A0] text-sm font-mono">
            Duracion: {formatDuration(duration)}
          </p>
        )}

        {synopsis && (
          <div>
            <h2 className="text-base font-semibold text-[#E8DAC0] mb-2">Sinopsis</h2>
            <p className="text-[#8085A0] text-sm leading-relaxed">{synopsis}</p>
          </div>
        )}

        {media.kind === 'episode' && media.data.season && (
          <div className="pt-4 border-t border-[#1E2840]">
            <Link
              to={`/season/${media.data.season.id}`}
              className="inline-flex items-center gap-2 text-sm text-[#8085A0] hover:text-[#E8DAC0] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Temporada {media.data.season.number}
            </Link>
          </div>
        )}

        {media.kind === 'video' && media.data.collection && (
          <div className="pt-4 border-t border-[#1E2840]">
            <Link
              to={`/collection/${media.data.collection.id}`}
              className="inline-flex items-center gap-2 text-sm text-[#8085A0] hover:text-[#E8DAC0] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a {media.data.collection.title}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function VideoUnavailable() {
  return (
    <div className="aspect-video w-full bg-[#0F1220] rounded border border-[#1E2840] flex flex-col items-center justify-center gap-3">
      <svg className="w-12 h-12 text-[#1E2840]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
      <p className="text-[#8085A0] text-sm">Video no disponible</p>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayerSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-8 bg-[#1E2840] rounded animate-pulse w-96" />
      <div className="aspect-video bg-[#0F1220] rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-[#1E2840] rounded animate-pulse w-full" />
        <div className="h-4 bg-[#1E2840] rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
      <span className="text-4xl mb-4" aria-hidden="true">&#9888;</span>
      <h2 className="text-lg font-semibold text-[#E8DAC0] mb-2">Error al cargar el video</h2>
      <p className="text-[#8085A0] text-sm mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#E8430A] hover:bg-[#FF5020] text-white font-medium px-6 py-2.5 rounded transition-colors duration-200"
      >
        Reintentar
      </button>
    </div>
  );
}

function NotFound({ type }: { type: 'episode' | 'video' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-4xl mb-4" aria-hidden="true">&#128269;</span>
      <h2 className="text-lg font-semibold text-[#E8DAC0] mb-2">
        {type === 'episode' ? 'Episodio no encontrado' : 'Video no encontrado'}
      </h2>
      <p className="text-[#8085A0] text-sm mb-6">
        Este contenido no existe o ya no esta disponible.
      </p>
      <Link
        to="/"
        className="bg-[#E8430A] hover:bg-[#FF5020] text-white font-medium px-6 py-2.5 rounded transition-colors duration-200"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
