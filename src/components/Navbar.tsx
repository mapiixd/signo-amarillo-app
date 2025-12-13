'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Importante: incluir cookies en la petición
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que quieres cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F4C430',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      background: '#0A0E1A',
      color: '#fff',
    })

    if (result.isConfirmed) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
        setUser(null)
        router.push('/')
        router.refresh()
        
        Swal.fire({
          icon: 'success',
          title: '¡Hasta pronto!',
          text: 'Has cerrado sesión exitosamente',
          timer: 2000,
          showConfirmButton: false,
          background: '#0A0E1A',
          color: '#fff',
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cerrar sesión',
          background: '#0A0E1A',
          color: '#fff',
        })
      }
    }
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <nav className="bg-[#0A0E1A] border-b border-[#2D9B96] shadow-lg relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home - El Signo Amarillo */}
          <Link 
            href="/" 
            className="flex items-center hover:opacity-90 transition-all group"
          >
            {/* Logo completo con texto */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#F4C430] rounded-lg opacity-10 group-hover:opacity-20 transition-opacity blur-sm"></div>
              <img 
                src="/Logo esquina.png" 
                alt="El Signo Amarillo" 
                className="h-14 md:h-16 relative z-10 drop-shadow-[0_0_8px_rgba(244,196,48,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(244,196,48,0.7)] transition-all object-contain"
              />
            </div>
          </Link>

          {/* Botón menú móvil */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-[#F4C430] p-2 rounded-lg hover:bg-[#1A2332] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              href="/cards"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/cards')
                  ? 'bg-[#2D9B96] text-white shadow-lg signo-glow-cyan'
                  : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
              }`}
            >
              Grimorio de Cartas
            </Link>

            <Link
              href="/decks"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/decks') && !isActive('/decks/community')
                  ? 'bg-[#2D9B96] text-white shadow-lg signo-glow-cyan'
                  : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
              }`}
            >
              Forja de Mazos
            </Link>

            <Link
              href="/decks/community"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/decks/community')
                  ? 'bg-[#2D9B96] text-white shadow-lg signo-glow-cyan'
                  : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
              }`}
            >
              Mazos de la Comunidad
            </Link>

            <Link
              href="/banlist"
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/banlist')
                  ? 'bg-[#2D9B96] text-white shadow-lg signo-glow-cyan'
                  : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
              }`}
            >
              Banlist
            </Link>

            {/* Admin Link - Solo para administradores */}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/cards"
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  isActive('/admin')
                    ? 'bg-[#F4C430] text-[#0A0E1A] shadow-lg signo-glow'
                    : 'text-[#F4C430] hover:bg-[#1A2332] hover:text-[#2D9B96]'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <span>Admin</span>
                </span>
              </Link>
            )}

            {/* Auth buttons */}
            <div className="ml-4 flex items-center space-x-2 border-l border-[#2D9B96] pl-4">
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#1A2332]">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-[#2D9B96] flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#F4C430]">{user.username}</span>
                            <span className="text-xs text-[#4ECDC4]">{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-medium cursor-pointer"
                      >
                        Salir
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-4 py-2 rounded-lg text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430] transition-all font-medium"
                      >
                        Iniciar Sesión
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 rounded-lg bg-[#F4C430] text-[#0A0E1A] hover:bg-[#2D9B96] hover:text-white transition-all font-medium shadow-lg"
                      >
                        Registrarse
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#2D9B96]">
            <div className="flex flex-col space-y-2">
              <Link
                href="/cards"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive('/cards')
                    ? 'bg-[#2D9B96] text-white shadow-lg'
                    : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
                }`}
              >
                Grimorio de Cartas
              </Link>

              <Link
                href="/decks"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive('/decks') && !isActive('/decks/community')
                    ? 'bg-[#2D9B96] text-white shadow-lg'
                    : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
                }`}
              >
                Forja de Mazos
              </Link>

              <Link
                href="/decks/community"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive('/decks/community')
                    ? 'bg-[#2D9B96] text-white shadow-lg'
                    : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
                }`}
              >
                Mazos de la Comunidad
              </Link>

              <Link
                href="/banlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive('/banlist')
                    ? 'bg-[#2D9B96] text-white shadow-lg'
                    : 'text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430]'
                }`}
              >
                Banlist
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin/cards"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all font-medium ${
                    isActive('/admin')
                      ? 'bg-[#F4C430] text-[#0A0E1A] shadow-lg'
                      : 'text-[#F4C430] hover:bg-[#1A2332] hover:text-[#2D9B96]'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <span>Admin</span>
                  </span>
                </Link>
              )}

              {!isLoading && (
                <div className="pt-4 border-t border-[#2D9B96] mt-2">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-[#1A2332] mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#2D9B96] flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#F4C430]">{user.username}</span>
                          <span className="text-xs text-[#4ECDC4]">{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all font-medium cursor-pointer"
                      >
                        Salir
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-center text-[#4ECDC4] hover:bg-[#1A2332] hover:text-[#F4C430] transition-all font-medium mb-2"
                      >
                        Iniciar Sesión
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-center bg-[#F4C430] text-[#0A0E1A] hover:bg-[#2D9B96] hover:text-white transition-all font-medium shadow-lg"
                      >
                        Registrarse
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

