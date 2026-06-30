import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[#E8DAC0]">Iniciar sesion</h1>
          <p className="text-sm text-[#8085A0] mt-1">Accede a tu cuenta para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0F1220] border border-[#1E2840] rounded-xl p-6 space-y-4"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="bg-[#E8430A]/10 border border-[#E8430A]/40 text-[#E8DAC0] text-sm px-4 py-3 rounded-lg"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[#E8DAC0]">
              Correo electronico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1E2840] text-[#E8DAC0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8430A]/60 transition-colors placeholder:text-[#8085A0]/50"
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[#E8DAC0]">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1E2840] text-[#E8DAC0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8430A]/60 transition-colors placeholder:text-[#8085A0]/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E8430A] hover:bg-[#FF5020] text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8085A0] mt-6">
          No tienes cuenta?{' '}
          <Link to="/register" className="text-[#E8430A] hover:text-[#FF5020] font-medium transition-colors">
            Registrarse
          </Link>
        </p>
      </div>
    </main>
  );
}
