'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = 'Recuperar Contraseña | El Signo Amarillo';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        html: `
          <p style="color: #4ECDC4;">Se ha enviado un enlace de recuperación a tu correo electrónico.</p>
          <p style="color: #4ECDC4; margin-top: 10px; font-size: 0.9em;">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
        `,
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
        confirmButtonText: 'Entendido',
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al procesar la solicitud',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] px-4 py-12">
      {/* Fondo con efecto místico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#F4C430] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2D9B96] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-[#121825] rounded-lg shadow-2xl p-8 border border-[#2D9B96] relative z-10">
        {/* Logo/Símbolo del Signo Amarillo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-[#F4C430] rounded-full opacity-20 blur-xl"></div>
            <img 
              src="/logo-icon.png" 
              alt="El Signo Amarillo" 
              className="w-20 h-20 relative z-10 drop-shadow-[0_0_15px_rgba(244,196,48,0.6)]"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#F4C430] mb-2 tracking-wide">Recuperar Contraseña</h1>
          <p className="text-[#4ECDC4] text-sm">Ingresa tu correo para recibir un enlace de recuperación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F4C430] text-[#0A0E1A] py-3 rounded-lg font-bold hover:bg-[#2D9B96] hover:text-white transition-all disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 shadow-lg hover:shadow-[0_0_20px_rgba(244,196,48,0.4)]"
          >
            {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-400 text-sm">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="text-[#F4C430] hover:text-[#2D9B96] font-semibold transition-colors">
              Iniciar sesión
            </Link>
          </p>
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

