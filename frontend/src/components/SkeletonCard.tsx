export default function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] rounded overflow-hidden bg-cinema-surface"
      aria-hidden="true"
    >
      <div className="aspect-[2/3] bg-[#1E2840] animate-pulse" />
      <div className="p-2">
        <div className="h-3 bg-[#1E2840] rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="mb-12 px-4 sm:px-6 lg:px-8" aria-hidden="true">
      <div className="h-6 bg-[#1E2840] rounded animate-pulse w-40 mb-5" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div
      className="w-full min-h-[72vh] bg-gradient-to-b from-[#0F1220] to-[#07080F] animate-pulse flex items-end"
      aria-hidden="true"
    >
      <div className="px-4 sm:px-6 lg:px-8 pb-20 w-full max-w-screen-xl mx-auto">
        <div className="h-3 bg-[#1E2840] rounded w-24 mb-4" />
        <div className="h-12 bg-[#1E2840] rounded w-80 mb-5" />
        <div className="h-4 bg-[#1E2840] rounded w-[28rem] mb-2" />
        <div className="h-4 bg-[#1E2840] rounded w-64 mb-8" />
        <div className="h-12 bg-[#1E2840] rounded w-36" />
      </div>
    </div>
  );
}
