import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const KOFI_USERNAME = import.meta.env.VITE_KOFI_USERNAME as string | undefined;
const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'contacto@fanrangers.com';

const KOFI_URL = KOFI_USERNAME ? `https://ko-fi.com/${KOFI_USERNAME}` : 'https://ko-fi.com';

interface PlanFeature {
  label: string;
  free: boolean;
}

const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Acceso al catálogo completo', free: true },
  { label: 'Sin anuncios en la plataforma', free: false },
  { label: 'Descargas directas sin acortador', free: false },
  { label: 'Apoyas la plataforma', free: false },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'w-4 h-4'}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'w-4 h-4'}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function KoFiIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
    </svg>
  );
}

function AlreadyPremiumBanner() {
  return (
    <section
      className="mb-12 rounded-xl border border-[#F5A623]/40 bg-[#F5A623]/5 p-6"
      aria-label="Estado de suscripcion premium"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <CheckIcon className="w-5 h-5 text-[#F5A623]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-[#F5A623] mb-1">Ya eres Premium</h2>
          <p className="text-[#8085A0] text-sm mb-4">
            Tu cuenta tiene acceso a todos los beneficios Premium activos.
          </p>
          <ul className="flex flex-col gap-2" role="list">
            {PLAN_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm text-[#E8DAC0]">
                <CheckIcon className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function PremiumPage() {
  const { isPremium, isAdmin } = useAuth();

  const showAlreadyPremium = isPremium || isAdmin;

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <header className="text-center mb-14">
          <span className="inline-block text-xs font-mono font-semibold tracking-[0.2em] uppercase text-[#F5A623] mb-4">
            Suscripcion
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#E8DAC0] mb-4">
            FanRangers Premium
          </h1>
          <p className="text-[#8085A0] text-lg max-w-xl mx-auto leading-relaxed">
            Apoya a la comunidad y disfruta de una experiencia sin interrupciones. Tu contribucion mantiene el proyecto vivo.
          </p>
        </header>

        {/* Already premium banner */}
        {showAlreadyPremium && <AlreadyPremiumBanner />}

        {/* Plan comparison */}
        <section className="mb-16" aria-label="Comparacion de planes">
          <h2 className="sr-only">Planes disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* FREE card */}
            <div className="rounded-xl border border-[#1E2840] bg-[#0F1220] p-6">
              <div className="mb-6">
                <span className="text-xs font-mono font-semibold tracking-[0.15em] uppercase text-[#8085A0]">
                  Gratuito
                </span>
                <p className="mt-2 text-3xl font-bold text-[#E8DAC0]">Gratis</p>
                <p className="text-sm text-[#8085A0] mt-1">Para todos los usuarios</p>
              </div>
              <ul className="flex flex-col gap-3" role="list">
                <li className="flex items-center gap-2.5 text-sm text-[#E8DAC0]">
                  <CheckIcon className="w-4 h-4 text-[#8085A0] flex-shrink-0" />
                  Acceso al catálogo
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#8085A0]">
                  <CrossIcon className="w-4 h-4 text-[#1E2840] flex-shrink-0" />
                  Anuncios en la plataforma
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#8085A0]">
                  <CrossIcon className="w-4 h-4 text-[#1E2840] flex-shrink-0" />
                  Descargas con acortador (con anuncios)
                </li>
              </ul>
            </div>

            {/* PREMIUM card */}
            <div className="rounded-xl border border-[#F5A623]/40 bg-[#192034] p-6 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F5A623]/0 via-[#F5A623] to-[#F5A623]/0"
                aria-hidden="true"
              />
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-[0.15em] uppercase text-[#F5A623]">
                  Premium
                </span>
                <p className="mt-2 text-3xl font-bold text-[#E8DAC0]">Donacion</p>
                <p className="text-sm text-[#8085A0] mt-1">Activacion manual en menos de 24 h</p>
              </div>
              <ul className="flex flex-col gap-3" role="list">
                <li className="flex items-center gap-2.5 text-sm text-[#E8DAC0]">
                  <CheckIcon className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                  Todo lo de FREE
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#E8DAC0]">
                  <CheckIcon className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                  Sin anuncios en la plataforma
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#E8DAC0]">
                  <CheckIcon className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                  Descargas directas sin acortador
                </li>
                <li className="flex items-center gap-2.5 text-sm text-[#E8DAC0]">
                  <CheckIcon className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
                  Apoyas la plataforma
                </li>
              </ul>
              {!showAlreadyPremium && (
                <a
                  href={KOFI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#FF5E5B] hover:bg-[#e54e4b] text-white font-semibold text-sm px-5 py-2.5 rounded transition-colors duration-200"
                  aria-label="Apoyanos en Ko-fi para activar Premium (abre en nueva pestana)"
                >
                  <KoFiIcon />
                  Apoyanos en Ko-fi
                </a>
              )}
            </div>
          </div>
        </section>

        {/* How to subscribe */}
        {!showAlreadyPremium && (
          <section
            className="mb-16 rounded-xl border border-[#1E2840] bg-[#0F1220] p-6 sm:p-8"
            aria-label="Como suscribirse"
          >
            <h2 className="font-display text-2xl font-bold text-[#E8DAC0] mb-2">
              Como suscribirse
            </h2>
            <p className="text-[#8085A0] text-sm mb-8">
              El proceso es manual y rapido. Sigue estos tres pasos:
            </p>
            <ol className="flex flex-col gap-6" role="list">
              <li className="flex gap-4">
                <span
                  className="w-8 h-8 rounded-full bg-[#192034] border border-[#1E2840] flex items-center justify-center text-sm font-bold text-[#F5A623] flex-shrink-0"
                  aria-hidden="true"
                >
                  1
                </span>
                <div>
                  <p className="text-[#E8DAC0] font-medium text-sm mb-1">Realiza una donacion en Ko-fi</p>
                  <p className="text-[#8085A0] text-sm">
                    Visita nuestra pagina de Ko-fi y apoya el proyecto con la cantidad que puedas.
                  </p>
                  <a
                    href={KOFI_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#FF5E5B] hover:text-[#e54e4b] transition-colors"
                    aria-label="Ir a Ko-fi (abre en nueva pestana)"
                  >
                    <KoFiIcon />
                    {KOFI_USERNAME ? `ko-fi.com/${KOFI_USERNAME}` : 'ko-fi.com'}
                  </a>
                </div>
              </li>

              <li className="flex gap-4">
                <span
                  className="w-8 h-8 rounded-full bg-[#192034] border border-[#1E2840] flex items-center justify-center text-sm font-bold text-[#F5A623] flex-shrink-0"
                  aria-hidden="true"
                >
                  2
                </span>
                <div>
                  <p className="text-[#E8DAC0] font-medium text-sm mb-1">
                    Escribenos a{' '}
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=Premium`}
                      className="text-[#F5A623] hover:text-[#e8a020] transition-colors"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                  <p className="text-[#8085A0] text-sm">
                    Usa el asunto <span className="font-mono text-[#E8DAC0]">"Premium"</span> e incluye el email con el que te registraste en FanRangers.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span
                  className="w-8 h-8 rounded-full bg-[#192034] border border-[#1E2840] flex items-center justify-center text-sm font-bold text-[#F5A623] flex-shrink-0"
                  aria-hidden="true"
                >
                  3
                </span>
                <div>
                  <p className="text-[#E8DAC0] font-medium text-sm mb-1">Activamos tu cuenta en menos de 24 horas</p>
                  <p className="text-[#8085A0] text-sm">
                    Verificamos tu donacion y activamos el plan Premium manualmente. Te notificaremos por email.
                  </p>
                </div>
              </li>
            </ol>

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#FF5E5B] hover:bg-[#e54e4b] text-white font-semibold text-sm px-6 py-3 rounded transition-colors duration-200"
                aria-label="Ir a Ko-fi para donar (abre en nueva pestana)"
              >
                <KoFiIcon />
                Ir a Ko-fi
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Premium`}
                className="inline-flex items-center justify-center gap-2 border border-[#1E2840] hover:border-[#F5A623]/40 text-[#E8DAC0] hover:text-[#F5A623] font-semibold text-sm px-6 py-3 rounded transition-colors duration-200"
              >
                Escribirnos por email
              </a>
            </div>
          </section>
        )}

        {/* Already premium — alternative CTA */}
        {showAlreadyPremium && (
          <div className="text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 bg-[#E8430A] hover:bg-[#FF5020] text-white font-semibold px-8 py-3 rounded transition-colors duration-200"
            >
              Explorar el catalogo
            </Link>
          </div>
        )}

        {/* Footer note */}
        {!showAlreadyPremium && (
          <p className="text-center text-[#8085A0] text-xs font-mono mt-8">
            El acceso Premium es gestionado manualmente. No hay cobros recurrentes ni suscripciones automaticas.
          </p>
        )}
      </div>
    </main>
  );
}
