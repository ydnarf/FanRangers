import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, name.trim() || undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-2xl font-bold text-[#E8430A]">
            {import.meta.env.VITE_APP_NAME ?? 'FanRangers'}
          </span>
          <h1 className="text-xl font-semibold text-[#E8DAC0] mt-2">Crear cuenta</h1>
          <p className="text-sm text-[#8085A0] mt-1">Registrate para empezar a ver contenido</p>
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
            <label htmlFor="name" className="block text-sm font-medium text-[#E8DAC0]">
              Nombre <span className="text-[#8085A0] font-normal">(opcional)</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1E2840] text-[#E8DAC0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8430A]/60 transition-colors placeholder:text-[#8085A0]/50"
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[#E8DAC0]">
              Correo electronico <span className="text-[#E8430A]">*</span>
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
              Contrasena <span className="text-[#E8430A]">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1E2840] text-[#E8DAC0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8430A]/60 transition-colors placeholder:text-[#8085A0]/50"
              placeholder="Minimo 8 caracteres"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-[#E8DAC0]">
              Confirmar contrasena <span className="text-[#E8430A]">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#07080F] border border-[#1E2840] text-[#E8DAC0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E8430A]/60 transition-colors placeholder:text-[#8085A0]/50"
              placeholder="Repite tu contrasena"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E8430A] hover:bg-[#FF5020] text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8085A0] mt-6">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#E8430A] hover:text-[#FF5020] font-medium transition-colors">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </main>
  );
}
