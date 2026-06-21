import { Link } from 'react-router-dom';

interface HeroBannerProps {
  backgroundImage?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export default function HeroBanner({
  backgroundImage,
  title,
  description,
  ctaLabel,
  ctaHref,
}: HeroBannerProps) {
  const hasImage = Boolean(backgroundImage);

  return (
    <section
      className="relative w-full min-h-[52vh] sm:min-h-[62vh] md:min-h-[72vh] flex items-end overflow-hidden"
      aria-label={`Destacado: ${title}`}
    >
      {/* Background */}
      {hasImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          role="img"
          aria-label={`Imagen de portada: ${title}`}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1030] via-[#07080F] to-[#07080F]" />
      )}

      {/* Cinematic top letterbox bar */}
      <div className="absolute top-0 left-0 right-0 h-[3.5vh] bg-black z-20 pointer-events-none" aria-hidden="true" />

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
      {/* Bottom fade — blends hero into page background with no hard edge */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080F] via-[#07080F]/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-32 hero-rise">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <p className="text-[#F5A623] text-xs font-mono tracking-[0.18em] uppercase mb-4 font-medium">
            Ahora disponible
          </p>

          <h1
            className="font-display font-bold tracking-tight text-[#E8DAC0] leading-[1.1] mb-5"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {title}
          </h1>

          <p className="text-[#8085A0] text-base sm:text-lg max-w-md leading-relaxed mb-8 line-clamp-3">
            {description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-2 bg-[#E8430A] hover:bg-[#FF5020] text-white font-semibold px-7 py-3 rounded transition-colors duration-200 shadow-lg shadow-[#E8430A]/30"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              {ctaLabel}
            </Link>
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-2 border border-[#E8DAC0]/25 hover:border-[#E8DAC0]/60 text-[#E8DAC0] font-semibold px-7 py-3 rounded transition-colors duration-200 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Más información
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
