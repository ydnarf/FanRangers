import { Link } from 'react-router-dom';

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'FanRangers';
const KOFI_USERNAME = import.meta.env.VITE_KOFI_USERNAME as string | undefined;
const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer
      className="bg-[#07080F] border-t border-[#1E2840] mt-16"
      role="contentinfo"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {/* Brand column */}
          <div>
            <Link to="/" aria-label={`${APP_NAME} — Inicio`}>
              <span className="font-display text-xl font-bold tracking-tight text-[#E8430A]">
                {APP_NAME}
              </span>
            </Link>
            <p className="mt-3 text-[#8085A0] text-sm leading-relaxed">
              Contenido legal &middot; Dominio publico &middot; Creative Commons
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h3 className="text-[#E8DAC0] text-xs font-mono font-medium uppercase tracking-[0.15em] mb-4">
              Explorar
            </h3>
            <nav aria-label="Navegacion de pie de pagina">
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    to="/"
                    className="text-[#8085A0] hover:text-[#E8DAC0] text-sm transition-colors duration-200"
                  >
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/catalogo"
                    className="text-[#8085A0] hover:text-[#E8DAC0] text-sm transition-colors duration-200"
                  >
                    Catalogo
                  </Link>
                </li>
                <li>
                  <a
                    href="#premium"
                    className="text-[#8085A0] hover:text-[#E8DAC0] text-sm transition-colors duration-200"
                  >
                    Premium (proximamente)
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Support column */}
          <div>
            <h3 className="text-[#E8DAC0] text-xs font-mono font-medium uppercase tracking-[0.15em] mb-4">
              Apoyanos
            </h3>
            {KOFI_USERNAME ? (
              <a
                href={`https://ko-fi.com/${KOFI_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FF5E5B] hover:bg-[#e54e4b] text-white text-sm font-medium px-4 py-2 rounded transition-colors duration-200"
                aria-label="Apoyanos en Ko-fi (abre en nueva pestana)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
                </svg>
                Apoyanos en Ko-fi
              </a>
            ) : (
              <p className="text-[#8085A0] text-sm">
                Este proyecto es sostenido por la comunidad.
              </p>
            )}
            <p className="mt-3 text-[#8085A0] text-xs leading-relaxed">
              Todo el contenido es de dominio publico o tiene licencia Creative Commons. Consultamos las fuentes antes de publicar.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E2840] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#8085A0] text-xs font-mono">
            &copy; {CURRENT_YEAR} {APP_NAME}. Contenido publicado bajo licencias libres.
          </p>
          <p className="text-[#8085A0] text-xs">
            Hecho con amor &middot; FanRangers
          </p>
        </div>
      </div>
    </footer>
  );
}
