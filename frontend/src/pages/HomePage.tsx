import { useEffect, useState } from 'react';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import AdSlot from '../components/AdSlot';
import { SkeletonHero, SkeletonRow } from '../components/SkeletonCard';
import { getCollections, getThumbnailUrl } from '../lib/api';
import { useSEO } from '../hooks/useSEO';
import { JsonLd } from '../components/JsonLd';
import type { Collection, ContentCardItem } from '../types';

const HERO_IMAGE = import.meta.env.VITE_HERO_IMAGE as string | undefined;

function collectionToCardItem(col: Collection): ContentCardItem {
  const thumbnail = col.coverImage ? getThumbnailUrl(col.coverImage) : null;
  return {
    id: col.id,
    title: col.title,
    thumbnail,
    href: `/collection/${col.id}`,
    type: col.type === 'SERIES' ? 'series' : 'film',
  };
}

interface HomeState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
}

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FanRangers',
  url: 'https://fanrangers.com',
  description:
    'Plataforma de streaming de contenido legal, dominio público y Creative Commons',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://fanrangers.com/catalogo',
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  useSEO({
    description:
      'Descubre series, películas y videos de dominio público y Creative Commons. Streaming legal y gratuito en FanRangers.',
  });

  const [state, setState] = useState<HomeState>({
    collections: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    getCollections()
      .then((data) => {
        if (!cancelled) {
          setState({ collections: data, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error al cargar el catalogo';
          setState({ collections: [], loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { collections, loading, error } = state;

  const featured = collections.filter((c) => c.featured);
  const heroCollection = featured[0] ?? collections[0] ?? null;
  const seriesCollections = collections.filter((c) => c.type === 'SERIES');
  const filmsCollections = collections.filter((c) => c.type === 'FILMS');

  const heroImage =
    HERO_IMAGE ||
    (heroCollection?.heroImage
      ? getThumbnailUrl(heroCollection.heroImage)
      : heroCollection?.coverImage
      ? getThumbnailUrl(heroCollection.coverImage)
      : undefined);

  return (
    <main>
      <JsonLd schema={WEBSITE_SCHEMA} />
      {/* Hero */}
      {loading ? (
        <SkeletonHero />
      ) : heroCollection ? (
        <HeroBanner
          backgroundImage={heroImage}
          title={heroCollection.title}
          description={heroCollection.description}
          ctaLabel="Ver ahora"
          ctaHref={`/collection/${heroCollection.id}`}
        />
      ) : (
        <HeroBanner
          title="Bienvenido a FanRangers"
          description="Tu plataforma de streaming de contenido legal, dominio publico y Creative Commons."
          ctaLabel="Explorar catalogo"
          ctaHref="/catalogo"
        />
      )}

      {/* AdSense — visible para visitantes y usuarios no-premium, oculto para premium */}
      <AdSlot id="adsense-home-banner" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-6" />

      {/* Content rows */}
      <div className="pb-6">
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            {featured.length > 0 && (
              <ContentRow
                title="Colecciones Destacadas"
                items={featured.map(collectionToCardItem)}
              />
            )}

            {seriesCollections.length > 0 && (
              <ContentRow
                title="Series"
                items={seriesCollections.map(collectionToCardItem)}
                viewAllHref="/catalogo"
              />
            )}

            {filmsCollections.length > 0 && (
              <ContentRow
                title="Peliculas"
                items={filmsCollections.map(collectionToCardItem)}
                viewAllHref="/catalogo"
              />
            )}

            {collections.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <span className="text-5xl mb-4" aria-hidden="true">&#127916;</span>
                <h2 className="text-xl font-semibold text-[#E8DAC0] mb-2">
                  El catalogo esta vacio
                </h2>
                <p className="text-[#8085A0] text-sm max-w-sm">
                  Pronto habra contenido disponible. Vuelve mas tarde.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 text-center px-4"
      role="alert"
      aria-live="polite"
    >
      <span className="text-5xl mb-4" aria-hidden="true">&#9888;</span>
      <h2 className="text-xl font-semibold text-[#E8DAC0] mb-2">
        No se pudo cargar el contenido
      </h2>
      <p className="text-[#8085A0] text-sm max-w-sm mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#E8430A] hover:bg-[#FF5020] text-white font-medium px-6 py-2.5 rounded transition-colors duration-200"
      >
        Reintentar
      </button>
    </div>
  );
}
