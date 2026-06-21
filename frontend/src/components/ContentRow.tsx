import { Link } from 'react-router-dom';
import ContentCard from './ContentCard';
import type { ContentCardItem } from '../types';

interface ContentRowProps {
  title: string;
  items: ContentCardItem[];
  viewAllHref?: string;
}

export default function ContentRow({ title, items, viewAllHref }: ContentRowProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-12" aria-label={title}>
      {/* Row header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-5 max-w-screen-xl mx-auto">
        <h2 className="flex items-center gap-3 text-lg sm:text-xl font-semibold tracking-tight text-[#E8DAC0]">
          {/* Film strip sprocket mark */}
          <span className="w-[3px] h-[1.1em] rounded-full bg-[#F5A623] flex-shrink-0" aria-hidden="true" />
          {title}
        </h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="text-sm text-[#8085A0] hover:text-[#E8DAC0] transition-colors duration-200 flex items-center gap-1"
            aria-label={`Ver todo: ${title}`}
          >
            Ver todo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* Responsive grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto"
        role="list"
        aria-label={`Contenido: ${title}`}
      >
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <ContentCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
