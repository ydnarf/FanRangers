import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFavorites, getProgress, getThumbnailUrl } from '../lib/api';
import type { Favorite, WatchProgress, ContentCardItem } from '../types';
import ContentCard from '../components/ContentCard';

const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'contacto@fanrangers.com';

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SubscriptionSection({ role }: { role: 'FREE' | 'PREMIUM' | 'ADMIN' }) {
  if (role === 'ADMIN') {
    return (
      <section
        className="mb-8 rounded-xl border border-[#1E2840] bg-[#0F1220] px-5 py-4 flex items-center gap-3"
        aria-label="Estado de suscripcion"
      >
        <span className="inline-block text-xs font-mono font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full bg-[#5B6AE8]/15 text-[#5B6AE8] border border-[#5B6AE8]/30">
          Administrador
        </span>
        <p className="text-[#8085A0] text-sm">Acceso completo a la plataforma.</p>
      </section>
    );
  }

  if (role === 'PREMIUM') {
    return (
      <section
        className="mb-8 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/5 px-5 py-5"
        aria-label="Mi suscripcion Premium"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block text-xs font-mono font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30">
            Premium
          </span>
          <h2 className="text-sm font-semibold text-[#E8DAC0]">Mi Suscripcion</h2>
        </div>
        <ul className="flex flex-col gap-2 mb-4" role="list">
          <li className="flex items-center gap-2 text-sm text-[#E8DAC0]">
            <span className="text-[#F5A623]"><CheckIcon /></span>
            Sin anuncios en la plataforma
          </li>
          <li className="flex items-center gap-2 text-sm text-[#E8DAC0]">
            <span className="text-[#F5A623]"><CheckIcon /></span>
            Descargas directas sin acortador
          </li>
          <li className="flex items-center gap-2 text-sm text-[#E8DAC0]">
            <span className="text-[#F5A623]"><CheckIcon /></span>
            Apoyas la plataforma
          </li>
        </ul>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Cancelar%20Premium`}
          className="text-xs text-[#8085A0] hover:text-[#E8DAC0] transition-colors"
        >
          ¿Quieres cancelar? Contactanos
        </a>
      </section>
    );
  }

  // FREE
  return (
    <section
      className="mb-8 rounded-xl border border-[#1E2840] bg-[#0F1220] px-5 py-5"
      aria-label="Mi suscripcion"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block text-xs font-mono font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full bg-[#1E2840] text-[#8085A0]">
          Plan Gratuito
        </span>
        <h2 className="text-sm font-semibold text-[#E8DAC0]">Mi Suscripcion</h2>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm text-[#8085A0] mb-4" role="list">
        <li>Anuncios en la plataforma</li>
        <li>Descargas con acortador (con anuncios)</li>
      </ul>
      <Link
        to="/premium"
        className="inline-flex items-center gap-2 bg-[#E8430A] hover:bg-[#FF5020] text-white font-semibold text-sm px-5 py-2.5 rounded transition-colors duration-200"
      >
        Hazte Premium
      </Link>
    </section>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [progress, setProgress] = useState<WatchProgress[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [favError, setFavError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch((err: unknown) =>
        setFavError(err instanceof Error ? err.message : 'Error al cargar favoritos')
      )
      .finally(() => setFavLoading(false));

    getProgress()
      .then(setProgress)
      .catch((err: unknown) =>
        setProgressError(err instanceof Error ? err.message : 'Error al cargar progreso')
      )
      .finally(() => setProgressLoading(false));
  }, []);

  if (!user) return null;

  const displayName = user.name ?? user.email;

  function favoriteToCard(fav: Favorite): ContentCardItem {
    if (fav.episode) {
      const ep = fav.episode;
      return {
        id: fav.id,
        title: ep.title,
        thumbnail: ep.thumbnail ? getThumbnailUrl(ep.thumbnail) : null,
        href: `/watch/episode/${ep.id}`,
        type: 'episode',
      };
    }
    if (fav.video) {
      const v = fav.video;
      return {
        id: fav.id,
        title: v.title,
        thumbnail: v.thumbnail ? getThumbnailUrl(v.thumbnail) : null,
        href: `/watch/video/${v.id}`,
        type: 'film',
      };
    }
    return { id: fav.id, title: 'Contenido', thumbnail: null, href: '/' };
  }

  function progressToCard(wp: WatchProgress): ContentCardItem & { progressRatio: number } {
    const ratio = wp.duration > 0 ? Math.min(wp.currentTime / wp.duration, 1) : 0;
    if (wp.episode) {
      const ep = wp.episode;
      return {
        id: wp.id,
        title: ep.title,
        thumbnail: ep.thumbnail ? getThumbnailUrl(ep.thumbnail) : null,
        href: `/watch/episode/${ep.id}`,
        type: 'episode',
        progressRatio: ratio,
        progress: ratio,
      };
    }
    if (wp.video) {
      const v = wp.video;
      return {
        id: wp.id,
        title: v.title,
        thumbnail: v.thumbnail ? getThumbnailUrl(v.thumbnail) : null,
        href: `/watch/video/${v.id}`,
        type: 'film',
        progressRatio: ratio,
        progress: ratio,
      };
    }
    return {
      id: wp.id,
      title: 'Contenido',
      thumbnail: null,
      href: '/',
      progressRatio: 0,
      progress: 0,
    };
  }

  const favoriteCards = favorites.map(favoriteToCard);
  const progressCards = progress.map(progressToCard);

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* User header */}
        <section className="flex items-center gap-5 mb-8" aria-label="Informacion de cuenta">
          <div
            className="w-16 h-16 rounded-full bg-[#E8430A] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            aria-hidden="true"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E8DAC0]">{displayName}</h1>
            <p className="text-sm text-[#8085A0] mt-0.5">{user.email}</p>
          </div>
        </section>

        {/* Subscription section */}
        <SubscriptionSection role={user.role} />

        {/* Favoritos */}
        <section className="mb-12" aria-label="Mis favoritos">
          <h2 className="text-lg font-bold text-[#E8DAC0] mb-4">Mis Favoritos</h2>
          {favLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] aspect-[2/3] bg-[#0F1220] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : favError ? (
            <p className="text-sm text-red-400" role="alert">{favError}</p>
          ) : favoriteCards.length === 0 ? (
            <p className="text-sm text-[#8085A0]">
              No tienes favoritos todavia. Agrega contenido desde el reproductor.
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {favoriteCards.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Seguir viendo */}
        <section aria-label="Seguir viendo">
          <h2 className="text-lg font-bold text-[#E8DAC0] mb-4">Seguir Viendo</h2>
          {progressLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] aspect-[2/3] bg-[#0F1220] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : progressError ? (
            <p className="text-sm text-red-400" role="alert">{progressError}</p>
          ) : progressCards.length === 0 ? (
            <p className="text-sm text-[#8085A0]">
              Aun no has comenzado a ver ningun contenido.
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {progressCards.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
