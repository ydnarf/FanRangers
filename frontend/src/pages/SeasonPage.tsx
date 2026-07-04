import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import SkeletonCard from '../components/SkeletonCard';
import { getSeason, getThumbnailUrl } from '../lib/api';
import { useSEO } from '../hooks/useSEO';
import type { Season, ContentCardItem } from '../types';

function episodeToCardItem(episode: {
  id: string;
  number: number;
  title: string;
  thumbnail: string | null;
}): ContentCardItem {
  return {
    id: episode.id,
    title: `Ep. ${episode.number}: ${episode.title}`,
    thumbnail: episode.thumbnail ? getThumbnailUrl(episode.thumbnail) : null,
    href: `/watch/episode/${episode.id}`,
    type: 'episode',
  };
}

interface PageState {
  season: Season | null;
  loading: boolean;
  error: string | null;
}

export default function SeasonPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<PageState>({
    season: null,
    loading: true,
    error: null,
  });

  const { season } = state;
  const displayLabel: string = season
    ? season.title
      ? `Temporada ${season.number}: ${season.title}`
      : `Temporada ${season.number}`
    : 'Temporada';
  const seoTitle = season?.collection
    ? `${displayLabel} — ${season.collection.title}`
    : displayLabel;

  useSEO({
    title: season ? seoTitle : undefined,
    description: season?.description ?? undefined,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setState({ season: null, loading: true, error: null });

    getSeason(id)
      .then((data) => {
        if (!cancelled) setState({ season: data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error al cargar la temporada';
          setState({ season: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const { loading, error } = state;

  return (
    <main className="min-h-screen pt-20">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#a3a3a3] mb-6 flex-wrap" aria-label="Ruta de navegacion">
          <Link to="/" className="hover:text-white transition-colors">
            Inicio
          </Link>
          <span aria-hidden="true">&rsaquo;</span>
          {loading ? (
            <span className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse inline-block" />
          ) : season?.collection ? (
            <>
              <Link
                to={`/collection/${season.collection.id}`}
                className="hover:text-white transition-colors"
              >
                {season.collection.title}
              </Link>
              <span aria-hidden="true">&rsaquo;</span>
              <span className="text-[#f5f5f5]">{displayLabel}</span>
            </>
          ) : (
            <span className="text-[#f5f5f5]">{displayLabel}</span>
          )}
        </nav>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !season ? (
          <NotFound />
        ) : (
          <SeasonContent season={season} displayLabel={displayLabel} />
        )}
      </div>
    </main>
  );
}

function SeasonContent({ season, displayLabel }: { season: Season; displayLabel: string }) {
  // Always render episodes in ascending order by their number. The backend
  // already sorts, but sorting here too guarantees the order regardless of the
  // API response order (belt-and-suspenders with the admin list).
  const episodes = [...(season.episodes ?? [])].sort((a, b) => a.number - b.number);

  return (
    <>
      {/* Season header */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          {displayLabel}
        </h1>
        {season.description && (
          <p className="text-[#a3a3a3] text-sm leading-relaxed max-w-2xl">
            {season.description}
          </p>
        )}
        <p className="text-[#a3a3a3] text-xs mt-2">
          {episodes.length} episodio{episodes.length !== 1 ? 's' : ''}
        </p>
      </header>

      {/* Episodes grid */}
      {episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4" aria-hidden="true">&#127916;</span>
          <p className="text-[#a3a3a3] text-sm">
            Esta temporada no tiene episodios disponibles todavia.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-16"
          role="list"
          aria-label={`Episodios de ${displayLabel}`}
        >
          {episodes.map((episode) => (
            <div key={episode.id} role="listitem">
              <ContentCard item={episodeToCardItem(episode)} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="h-10 bg-[#2a2a2a] rounded animate-pulse w-64 mb-3" />
      <div className="h-4 bg-[#2a2a2a] rounded animate-pulse w-96 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
      <span className="text-4xl mb-4" aria-hidden="true">&#9888;</span>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">Error al cargar</h2>
      <p className="text-[#a3a3a3] text-sm mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-red-600 to-yellow-500 text-white font-medium px-6 py-2.5 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all duration-200"
      >
        Reintentar
      </button>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-4xl mb-4" aria-hidden="true">&#128269;</span>
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">Temporada no encontrada</h2>
      <p className="text-[#a3a3a3] text-sm mb-6">
        Esta temporada no existe o ya no esta disponible.
      </p>
      <Link
        to="/"
        className="bg-gradient-to-r from-red-600 to-yellow-500 text-white font-medium px-6 py-2.5 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all duration-200"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
