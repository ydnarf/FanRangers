import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ContentCardItem } from '../types';

interface ContentCardProps {
  item: ContentCardItem;
}

const TYPE_LABEL: Record<NonNullable<ContentCardItem['type']>, string> = {
  series: 'Serie',
  film: 'Pelicula',
  episode: 'Episodio',
};

export default function ContentCard({ item }: ContentCardProps) {
  const typeLabel = item.type ? TYPE_LABEL[item.type] : null;
  const hasProgress = typeof item.progress === 'number' && item.progress > 0;

  // Episodes and series-attached videos use landscape 16:9 thumbnails (matching
  // YouTube). Collection posters (series / film) keep the 2:3 portrait shape.
  const aspectRatio = item.type === 'episode' ? '16/9' : '2/3';

  // Fall back to the placeholder when there's no thumbnail OR the image fails to
  // load (broken URL / missing file) — never show a broken-image icon.
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(item.thumbnail) && !imgFailed;

  return (
    <Link
      to={item.href}
      className="group block w-full rounded overflow-hidden transition-all duration-300 ease-out hover:scale-[1.04] hover:shadow-xl hover:shadow-black/60 hover:z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8430A]"
      aria-label={item.title}
    >
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden bg-[#0F1220]" style={{ aspectRatio }}>
        {showImage ? (
          <img
            src={item.thumbnail as string}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover object-center transition-[transform,filter] duration-500 ease-out group-hover:scale-105 group-hover:brightness-110"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2038] to-[#0F1220] flex items-end p-3">
            <span className="text-[#E8DAC0] text-sm font-semibold line-clamp-3 leading-snug">
              {item.title}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 p-3">
          <div
            className="w-12 h-12 rounded-full bg-[#E8430A] flex items-center justify-center shadow-lg shadow-[#E8430A]/40"
            aria-hidden="true"
          >
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <span className="text-[#E8DAC0] text-xs font-medium text-center line-clamp-2 leading-snug">
            {item.title}
          </span>
        </div>

        {/* Type badge — overlaid in the corner, never affects the title below */}
        {typeLabel && (
          <span className="absolute top-2 left-2 z-10 bg-[#5B6AE8]/85 text-white text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm backdrop-blur-sm tracking-wide">
            {typeLabel}
          </span>
        )}

        {/* Progress bar */}
        {hasProgress && (
          <div
            className="absolute bottom-0 left-0 h-[3px] bg-[#E8430A]"
            style={{ width: `${(item.progress ?? 0) * 100}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Title below the thumbnail, on its own line */}
      <p className="mt-2 px-0.5 text-[#8085A0] text-xs font-medium truncate leading-snug transition-colors duration-300 group-hover:text-[#E8DAC0]">
        {item.title}
      </p>
    </Link>
  );
}
