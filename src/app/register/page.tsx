'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de contraseñas
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        background: '#0A0E1A',
        color: '#F4C430',
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La contraseña debe tener al menos 6 caracteres',
        background: '#0A0E1A',
        color: '#F4C430',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: `Bienvenido ${data.username}`,
        timer: 1500,
        showConfirmButton: false,
        background: '#0A0E1A',
        color: '#F4C430',
      });

      // Forzar recarga completa de la página para actualizar el Navbar
      window.location.href = '/';
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al registrarse',
        background: '#0A0E1A',
        color: '#F4C430',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] px-4 py-12">
      {/* Fondo con efecto místico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-80 h-80 bg-[#F4C430] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-[#2D9B96] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-[#121825] rounded-lg shadow-2xl p-8 border border-[#2D9B96] relative z-10">
        {/* Logo/Símbolo del Signo Amarillo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-[#2D9B96] rounded-full opacity-20 blur-xl"></div>
            <img 
              src="/logo-icon.png" 
              alt="El Signo Amarillo" 
              className="w-20 h-20 relative z-10 drop-shadow-[0_0_15px_rgba(45,155,150,0.6)]"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#F4C430] mb-2 tracking-wide">Crear Cuenta</h1>
          <p className="text-[#4ECDC4] text-sm">Únete al Constructor de Mazos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#4ECDC4] mb-2">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2332] border border-[#2D9B96] rounded-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-white placeholder-gray-500 transition-all"
              placeholder="usuario123"
              required
              disabled={isLoading}
              minLength={3}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#4ECDC4] mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2332] border border-[#2D9B96] rounded-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-white placeholder-gray-500 transition-all"
              placeholder="correo@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#4ECDC4] mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2332] border border-[#2D9B96] rounded-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-white placeholder-gray-500 transition-all"
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#4ECDC4] mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2332] border border-[#2D9B96] rounded-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-white placeholder-gray-500 transition-all"
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2D9B96] text-white py-3 rounded-lg font-bold hover:bg-[#F4C430] hover:text-[#0A0E1A] transition-all disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 shadow-lg hover:shadow-[0_0_20px_rgba(45,155,150,0.4)]"
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-[#F4C430] hover:text-[#2D9B96] font-semibold transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-[#4ECDC4] hover:text-[#F4C430] text-sm transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

