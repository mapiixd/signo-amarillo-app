'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.title = 'Restablecer Contraseña | El Signo Amarillo';
    const tokenParam = searchParams.get('token');
    console.log('Token recibido de URL:', tokenParam);
    if (tokenParam) {
      // Decodificar el token por si viene codificado en la URL
      const decodedToken = decodeURIComponent(tokenParam);
      console.log('Token decodificado:', decodedToken);
      setToken(decodedToken);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Token inválido',
        text: 'El enlace de recuperación no es válido o ha expirado.',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
      }).then(() => {
        router.push('/forgot-password');
      });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'Las contraseñas deben ser iguales',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
      });
      return;
    }

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Token inválido',
        text: 'El enlace de recuperación no es válido',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
      });
      return;
    }

    setIsLoading(true);

    console.log('Enviando solicitud de reset con token:', token);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña');
      }

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
        confirmButtonText: 'Ir a iniciar sesión',
      });

      // Redirigir al login
      router.push('/login');
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al restablecer la contraseña',
        background: '#0A0E1A',
        color: '#F4C430',
        confirmButtonColor: '#F4C430',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] px-4 py-12">
        <div className="text-center">
          <p className="text-[#4ECDC4]">Cargando...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-[#F4C430] mb-2 tracking-wide">Nueva Contraseña</h1>
          <p className="text-[#4ECDC4] text-sm">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-[#4ECDC4] mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2332] border border-[#2D9B96] rounded-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-white placeholder-gray-500 transition-all"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
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
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F4C430] text-[#0A0E1A] py-3 rounded-lg font-bold hover:bg-[#2D9B96] hover:text-white transition-all disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 shadow-lg hover:shadow-[0_0_20px_rgba(244,196,48,0.4)]"
          >
            {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#4ECDC4] hover:text-[#F4C430] text-sm transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] px-4 py-12">
        <div className="text-center">
          <p className="text-[#4ECDC4]">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

