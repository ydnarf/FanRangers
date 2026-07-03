import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FanRangersLogo from './FanRangersLogo';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, isPremium, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Solo la home tiene hero a pantalla completa detrás del header;
  // en el resto de páginas el header lleva siempre fondo sólido.
  const hasHero = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive ? 'text-[#E8DAC0]' : 'text-[#8085A0] hover:text-[#E8DAC0]'
    }`;

  function handleLogout() {
    setUserMenuOpen(false);
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  const displayName = user?.name ?? user?.email ?? '';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen || !hasHero
          ? 'bg-[#07080F]/95 backdrop-blur-sm border-b border-[#1E2840]'
          : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="FanRangers — Inicio">
            <FanRangersLogo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegacion principal">
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={navLinkClass}>
              Catalogo
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
            {!loading && isPremium ? (
              <span className="text-xs font-mono text-[#F5A623] border border-[#F5A623]/30 bg-[#F5A623]/5 px-3 py-1.5 rounded">
                Premium
              </span>
            ) : (
              <a
                href="#premium"
                className="text-sm font-medium border border-[#E8430A]/50 text-[#E8DAC0]/70 hover:border-[#E8430A] hover:text-[#E8DAC0] px-4 py-1.5 rounded transition-colors duration-200"
                aria-label="Hazte Premium (proximamente)"
              >
                Hazte Premium
              </a>
            )}

            {/* Auth area */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-medium text-[#8085A0] hover:text-[#E8DAC0] transition-colors duration-200"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menu de usuario"
                >
                  <span className="w-7 h-7 rounded-full bg-[#E8430A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 bg-[#0F1220] border border-[#1E2840] rounded-lg shadow-xl shadow-black/60 overflow-hidden"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-[#1E2840]">
                      <p className="text-xs text-[#8085A0]">Conectado como</p>
                      <p className="text-sm text-[#E8DAC0] font-medium truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8085A0] hover:text-[#E8DAC0] hover:bg-[#192034] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mi Perfil
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8085A0] hover:text-[#E8DAC0] hover:bg-[#192034] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Panel Admin
                      </Link>
                    )}
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#E8430A]/80 hover:text-[#E8430A] hover:bg-[#192034] transition-colors border-t border-[#1E2840]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#8085A0] hover:text-[#E8DAC0] transition-colors duration-200"
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-[#E8430A] hover:bg-[#FF5020] text-white px-4 py-1.5 rounded transition-colors duration-200"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded text-[#8085A0] hover:text-[#E8DAC0] transition-colors"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          className="md:hidden bg-[#07080F] border-t border-[#1E2840] px-4 py-4 flex flex-col gap-4"
          aria-label="Navegacion movil"
        >
          <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Catalogo
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Admin
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/profile" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Mi Perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-[#E8430A]/80 hover:text-[#E8430A] transition-colors text-left"
              >
                Cerrar sesion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                Iniciar sesion
              </NavLink>
              <NavLink
                to="/register"
                className="text-sm font-medium bg-[#E8430A] hover:bg-[#FF5020] text-white px-4 py-2 rounded text-center transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Registrarse
              </NavLink>
            </>
          )}
          {!loading && isPremium ? (
            <span className="text-xs font-mono text-[#F5A623] border border-[#F5A623]/30 bg-[#F5A623]/5 px-3 py-2 rounded text-center">
              Premium
            </span>
          ) : (
            <a
              href="#premium"
              className="text-sm font-medium border border-[#E8430A]/50 text-[#E8DAC0]/70 hover:border-[#E8430A] hover:text-[#E8DAC0] px-4 py-2 rounded transition-colors duration-200 text-center"
              onClick={() => setMenuOpen(false)}
            >
              Hazte Premium
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
