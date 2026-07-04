import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ContentRow from '../components/ContentRow';
import ContentCard from '../components/ContentCard';
import { SkeletonRow } from '../components/SkeletonCard';
import { getCollection, getThumbnailUrl } from '../lib/api';
import { youtubeThumbnailUrl } from '../lib/youtube';
import { useSEO } from '../hooks/useSEO';
import { JsonLd } from '../components/JsonLd';
import type { Collection, ContentCardItem } from '../types';

function episodeToCardItem(episode: {
  id: string;
  number: number;
  title: string;
  thumbnail: string | null;
  youtubeId?: string | null;
}): ContentCardItem {
  return {
    id: episode.id,
    title: `Ep. ${episode.number}: ${episode.title}`,
    thumbnail: episode.thumbnail
      ? getThumbnailUrl(episode.thumbnail)
      : episode.youtubeId
        ? youtubeThumbnailUrl(episode.youtubeId)
        : null,
    href: `/watch/episode/${episode.id}`,
    type: 'episode',
  };
}

function videoToCardItem(
  video: { id: string; title: string; thumbnail: string | null; youtubeId?: string | null },
  cardType: ContentCardItem['type'] = 'film'
): ContentCardItem {
  return {
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail
      ? getThumbnailUrl(video.thumbnail)
      : video.youtubeId
        ? youtubeThumbnailUrl(video.youtubeId)
        : null,
    href: `/watch/video/${video.id}`,
    type: cardType,
  };
}

interface PageState {
  collection: Collection | null;
  loading: boolean;
  error: string | null;
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<PageState>({
    collection: null,
    loading: true,
    error: null,
  });

  const { collection } = state;
  const coverUrl = collection?.coverImage ? getThumbnailUrl(collection.coverImage) : undefined;

  useSEO({
    title: collection?.title,
    description: collection?.description,
    image: coverUrl,
    ogType: collection?.type === 'SERIES' ? 'video.tv_show' : 'video.other',
  });

  const collectionSchema = collection
    ? ({
        '@context': 'https://schema.org',
        '@type': collection.type === 'SERIES' ? 'TVSeries' : 'ItemList',
        name: collection.title,
        description: collection.description,
        ...(coverUrl ? { image: coverUrl } : {}),
      } as Record<string, unknown>)
    : null;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setState({ collection: null, loading: true, error: null });

    getCollection(id)
      .then((data) => {
        if (!cancelled) setState({ collection: data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error al cargar la coleccion';
          setState({ collection: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const { loading, error } = state;

  return (
    <main className="min-h-screen pt-20">
      {collectionSchema && <JsonLd schema={collectionSchema} />}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#a3a3a3] mb-6" aria-label="Ruta de navegacion">
          <Link to="/" className="hover:text-white transition-colors">
            Inicio
          </Link>
          <span aria-hidden="true">&rsaquo;</span>
          {loading ? (
            <span className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse inline-block" />
          ) : (
            <span className="text-[#f5f5f5]">{collection?.title ?? 'Coleccion'}</span>
          )}
        </nav>

        {loading ? (
          <>
            {/* Hero skeleton */}
            <div className="w-full h-48 bg-[#1a1a1a] rounded-xl animate-pulse mb-8" />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !collection ? (
          <NotFound />
        ) : (
          <>
            {/* Collection header */}
            <CollectionHeader collection={collection} />

            {/* Content */}
            {collection.type === 'SERIES' ? (
              <SeriesContent collection={collection} />
            ) : (
              <FilmsContent collection={collection} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function CollectionHeader({ collection }: { collection: Collection }) {
  const coverUrl = collection.coverImage ? getThumbnailUrl(collection.coverImage) : null;

  return (
    <header className="flex flex-col sm:flex-row gap-6 mb-10">
      {/* Cover image */}
      <div className="flex-shrink-0 w-full sm:w-48 aspect-[2/3] sm:aspect-auto sm:h-72 rounded-xl overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Portada: ${collection.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900 to-yellow-900 flex items-end p-4">
            <span className="text-white font-bold text-lg leading-snug">{collection.title}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-end py-2">
        <span className="text-[#a3a3a3] text-xs font-medium uppercase tracking-wider mb-2">
          {collection.type === 'SERIES' ? 'Serie' : 'Peliculas'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          {collection.title}
        </h1>
        <p className="text-[#a3a3a3] text-sm leading-relaxed max-w-2xl mb-4">
          {collection.description}
        </p>
        {collection._count && (
          <div className="flex gap-4 text-xs text-[#a3a3a3]">
            {collection._count.seasons > 0 && (
              <span>{collection._count.seasons} temporada{collection._count.seasons !== 1 ? 's' : ''}</span>
            )}
            {collection._count.videos > 0 && (
              <span>{collection._count.videos} video{collection._count.videos !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function SeriesContent({ collection }: { collection: Collection }) {
  const seasons = collection.seasons ?? [];
  const videos = collection.videos ?? [];

  if (seasons.length === 0 && videos.length === 0) {
    return (
      <EmptyState message="Esta serie no tiene temporadas disponibles todavia." />
    );
  }

  return (
    <div className="pb-16">
      {seasons.map((season) => {
        // Ascending by episode number (the backend already sorts; this guards
        // the render regardless of API response order).
        const episodes = [...(season.episodes ?? [])].sort((a, b) => a.number - b.number);
        const seasonTitle =
          season.title
            ? `Temporada ${season.number}: ${season.title}`
            : `Temporada ${season.number}`;

        return (
          <ContentRow
            key={season.id}
            title={seasonTitle}
            items={episodes.map(episodeToCardItem)}
            viewAllHref={`/season/${season.id}`}
          />
        );
      })}

      {videos.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-[#f5f5f5] mb-6">Videos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {videos.map((video) => (
              <ContentCard key={video.id} item={videoToCardItem(video, 'episode')} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilmsContent({ collection }: { collection: Collection }) {
  const videos = collection.videos ?? [];

  if (videos.length === 0) {
    return <EmptyState message="Esta coleccion no tiene videos disponibles todavia." />;
  }

  return (
    <div className="pb-16">
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-6">
        {videos.length} video{videos.length !== 1 ? 's' : ''}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {videos.map((video) => (
          <ContentCard key={video.id} item={videoToCardItem(video)} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-4xl mb-4" aria-hidden="true">&#127916;</span>
      <p className="text-[#a3a3a3] text-sm">{message}</p>
    </div>
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
      <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">Coleccion no encontrada</h2>
      <p className="text-[#a3a3a3] text-sm mb-6">
        Esta coleccion no existe o ya no esta disponible.
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
