export default function FanRangersLogo() {
  return (
    <span className="fr-logo" aria-label="FanRangers">
      {/* "Fan" */}
      <span className="fr-text" aria-hidden="true">Fan</span>

      {/* Lightning bolt */}
      <span className="fr-bolt-wrap" aria-hidden="true">
        {/* Impact burst behind the bolt */}
        <span className="fr-burst" />

        <svg
          className="fr-bolt"
          viewBox="0 0 14 26"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="fr-bolt-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#fde047" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Classic zigzag lightning bolt shape */}
          <path d="M 8 0 L 1 14 L 6 14 L 4 26 L 13 12 L 8 12 Z" fill="url(#fr-bolt-grad)" />
        </svg>
      </span>

      {/* "Rangers" */}
      <span className="fr-text" aria-hidden="true">Rangers</span>
    </span>
  );
}
