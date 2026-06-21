import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import SkeletonCard from '../components/SkeletonCard';
import AdSlot from '../components/AdSlot';
import { getCollections, getVideos, getThumbnailUrl } from '../lib/api';
import type { Collection, Video, ContentCardItem } from '../types';

type FilterType = 'ALL' | 'SERIES' | 'FILMS' | 'VIDEOS';

function collectionToCardItem(col: Collection): ContentCardItem {
  return {
    id: col.id,
    title: col.title,
    thumbnail: col.coverImage ? getThumbnailUrl(col.coverImage) : null,
    href: `/collection/${col.id}`,
    type: col.type === 'SERIES' ? 'series' : 'film',
  };
}

function videoToCardItem(vid: Video): ContentCardItem {
  return {
    id: vid.id,
    title: vid.title,
    thumbnail: vid.thumbnail ? getThumbnailUrl(vid.thumbnail) : null,
    href: `/watch/video/${vid.id}`,
    type: vid.collection?.type === 'SERIES' ? 'episode' : 'film',
  };
}

interface PageState {
  collections: Collection[];
  videos: Video[];
  loading: boolean;
  error: string | null;
}

const FILTER_LABELS: Record<FilterType, string> = {
  ALL: 'Todo',
  SERIES: 'Series',
  FILMS: 'Peliculas',
  VIDEOS: 'Videos',
};

export default function CatalogPage() {
  const [state, setState] = useState<PageState>({
    collections: [],
    videos: [],
    loading: true,
    error: null,
  });
  const [filter, setFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCollections(), getVideos()])
      .then(([cols, vids]) => {
        if (!cancelled) setState({ collections: cols, videos: vids, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error al cargar el catalogo';
          setState({ collections: [], videos: [], loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { collections, videos, loading, error } = state;

  const filteredCollections =
    filter === 'VIDEOS' ? [] :
    filter === 'ALL' ? collections :
    collections.filter((c) => c.type === filter);

  const filteredVideos = filter === 'ALL' || filter === 'VIDEOS' ? videos : [];

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-[#8085A0] mb-4" aria-label="Ruta de navegacion">
            <Link to="/" className="hover:text-[#E8DAC0] transition-colors">
              Inicio
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <span className="text-[#E8DAC0]">Catalogo</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#E8DAC0] mb-6">
            Catalogo completo
          </h1>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por tipo">
            {(['ALL', 'SERIES', 'FILMS', 'VIDEOS'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  filter === type
                    ? 'bg-[#E8430A] text-white'
                    : 'bg-[#0F1220] border border-[#1E2840] text-[#8085A0] hover:text-[#E8DAC0] hover:border-[#8085A0]/40'
                }`}
                aria-pressed={filter === type}
              >
                {FILTER_LABELS[type]}
              </button>
            ))}
          </div>
        </header>

        {/* AdSense — visible for non-premium visitors */}
        <AdSlot id="adsense-catalog-top" className="mb-8" />

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : filteredCollections.length === 0 && filteredVideos.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-10">
            {filteredCollections.length > 0 && (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                role="list"
                aria-label="Colecciones"
              >
                {filteredCollections.map((col) => (
                  <div key={col.id} role="listitem">
                    <ContentCard item={collectionToCardItem(col)} />
                  </div>
                ))}
              </div>
            )}

            {filteredVideos.length > 0 && (
              <>
                {filter === 'ALL' && (
                  <h2 className="flex items-center gap-3 text-xl font-semibold text-[#E8DAC0]">
                    <span className="w-[3px] h-[1em] rounded-full bg-[#F5A623]" aria-hidden="true" />
                    Videos
                  </h2>
                )}
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  role="list"
                  aria-label="Videos"
                >
                  {filteredVideos.map((vid) => (
                    <div key={vid.id} role="listitem">
                      <ContentCard item={videoToCardItem(vid)} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  const label =
    filter === 'SERIES' ? 'series' : filter === 'FILMS' ? 'peliculas' : filter === 'VIDEOS' ? 'videos' : 'colecciones';
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-5xl mb-4" aria-hidden="true">&#127916;</span>
      <h2 className="text-xl font-semibold text-[#E8DAC0] mb-2">
        No hay {label} disponibles
      </h2>
      <p className="text-[#8085A0] text-sm">Vuelve pronto para ver nuevo contenido.</p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center" role="alert">
      <span className="text-5xl mb-4" aria-hidden="true">&#9888;</span>
      <h2 className="text-xl font-semibold text-[#E8DAC0] mb-2">Error al cargar el catalogo</h2>
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
