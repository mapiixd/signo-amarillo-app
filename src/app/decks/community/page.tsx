'use client'

import { useState, useEffect } from 'react'
import { DeckWithCards } from '@/types'
import Link from 'next/link'
import Swal from 'sweetalert2'
import Footer from '@/components/Footer'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface CommunityDeck extends DeckWithCards {
  likes_count?: number
  user?: {
    id: string
    username: string
  }
  is_liked?: boolean
}

export default function CommunityDecksPage() {
  const router = useRouter()

  useEffect(() => {
    document.title = 'Mazos de la Comunidad | El Signo Amarillo';
  }, [])
  const [decks, setDecks] = useState<CommunityDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [sortBy, setSortBy] = useState<'likes' | 'recent' | 'name'>('recent')
  const [selectedRace, setSelectedRace] = useState<string>('')
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkAuthentication()
    // Cargar mazos inmediatamente sin esperar autenticación
    fetchDecks()
  }, [])

  useEffect(() => {
    // Recargar mazos cuando cambian los filtros o paginación
    fetchDecks()
  }, [currentPage, sortBy, selectedRace])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.status === 401) {
        setIsAuthenticated(false)
      } else if (response.ok) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking authentication:', error)
      setIsAuthenticated(false)
    }
  }

  useEffect(() => {
    // Cargar likes del usuario si está autenticado
    if (isAuthenticated === true) {
      fetchUserLikes()
    } else {
      // Si no está autenticado, limpiar los likes
      setUserLikes(new Set())
    }
  }, [decks, isAuthenticated])

  const fetchDecks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '20')
      params.append('sortBy', sortBy)
      if (selectedRace) params.append('race', selectedRace)

      const response = await fetch(`/api/decks/community?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDecks(data.decks)
        setPagination(data.pagination)
        
        // Actualizar estado de autenticación si cambió
        if (response.status === 200) {
          // Verificar si hay algún mazo con is_liked definido (indica que el usuario está autenticado)
          const hasLikesInfo = data.decks.some((deck: CommunityDeck) => deck.is_liked !== undefined)
          if (hasLikesInfo && isAuthenticated === false) {
            setIsAuthenticated(true)
          }
        }
      } else {
        const error = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'No se pudieron cargar los mazos',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
      }
    } catch (error) {
      console.error('Error fetching community decks:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los mazos de la comunidad',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserLikes = async () => {
    if (!isAuthenticated) return
    
    try {
      // Usar la información de is_liked que ya viene de la API si está disponible
      const likesSet = new Set(
        decks.filter(deck => deck.is_liked === true).map(deck => deck.id)
      )
      setUserLikes(likesSet)
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }

  const handleLike = async (deckId: string) => {
    try {
      const response = await fetch(`/api/decks/${deckId}/like`, {
        method: 'POST'
      })

      if (response.status === 401) {
        Swal.fire({
          icon: 'info',
          title: 'Inicia sesión',
          text: 'Debes iniciar sesión para dar like a los mazos',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        return
      }

      if (response.ok) {
        const data = await response.json()
        const isLiked = data.liked

        // Actualizar el estado local
        setDecks(prevDecks =>
          prevDecks.map(deck => {
            if (deck.id === deckId) {
              return {
                ...deck,
                likes_count: (deck.likes_count || 0) + (isLiked ? 1 : -1),
                is_liked: isLiked
              }
            }
            return deck
          })
        )

        // Actualizar el set de likes del usuario
        if (isLiked) {
          setUserLikes(prev => new Set(prev).add(deckId))
        } else {
          setUserLikes(prev => {
            const newSet = new Set(prev)
            newSet.delete(deckId)
            return newSet
          })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo dar like al mazo',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
    }
  }

  const handleCopy = async (deck: CommunityDeck) => {
    try {
      const response = await fetch(`/api/decks/${deck.id}/copy`, {
        method: 'POST'
      })

      if (response.status === 401) {
        Swal.fire({
          icon: 'info',
          title: 'Inicia sesión',
          text: 'Debes iniciar sesión para copiar mazos',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        return
      }

      if (response.ok) {
        const copiedDeck = await response.json()
        await Swal.fire({
          icon: 'success',
          title: '¡Mazo copiado!',
          text: `El mazo "${deck.name}" ha sido copiado a tus mazos personales`,
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        router.push(`/decks/${copiedDeck.id}/edit`)
      } else {
        const error = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'No se pudo copiar el mazo',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
      }
    } catch (error) {
      console.error('Error copying deck:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo copiar el mazo',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const races = [
    'Bestia',
    'Caballero',
    'Dragón',
    'Eterno',
    'Faerie',
    'Guerrero',
    'Héroe',
    'Sacerdote',
    'Sombra'
  ]

  // Mostrar carga mientras se cargan los mazos
  if (loading && decks.length === 0) {
    return (
      <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
            <p className="text-[#4ECDC4]">Cargando mazos de la comunidad...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4C430] mb-2">Mazos de la Comunidad</h1>
          <p className="text-[#A0A0A0] text-sm sm:text-base">
            Descubre y comparte mazos creados por otros jugadores
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ordenar por */}
            <div>
              <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                Ordenar por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'likes' | 'recent' | 'name')
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
              >
                <option value="likes">Más populares</option>
                <option value="recent">Más recientes</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </div>

            {/* Filtrar por raza */}
            <div>
              <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                Filtrar por raza:
              </label>
              <select
                value={selectedRace}
                onChange={(e) => {
                  setSelectedRace(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
              >
                <option value="">Todas las razas</option>
                {races.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de mazos */}
        {decks.length === 0 ? (
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-md p-12 text-center">
            <p className="text-[#4ECDC4] text-lg">No hay mazos públicos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => {
              const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0)
              const totalSideboard = deck.sideboard.reduce((sum, c) => sum + c.quantity, 0)
              // Usar is_liked de la API si está disponible, o del estado local
              const isLiked = deck.is_liked !== undefined ? deck.is_liked : userLikes.has(deck.id)

              return (
                <div
                  key={deck.id}
                  className="bg-[#0F1419] border border-[#2D9B96] rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:border-[#4ECDC4] transition-all group"
                >
                  {/* Header con imagen de raza */}
                  <div className="relative bg-[#1A2332] p-4 overflow-hidden min-h-[100px]">
                    {/* Imagen de fondo de la raza */}
                    {deck.race && (
                      <img 
                        src={`/razas/${deck.race}.png`} 
                        alt={deck.race}
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                        style={deck.race === 'Sombra' ? { objectPosition: '50% 10%' } : undefined}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    
                    {/* Contenido sobre la imagen */}
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold text-[#F4C430] mb-1 drop-shadow-lg line-clamp-2">
                        {deck.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {deck.race && (
                          <span className="text-xs bg-[#0A0E1A] text-[#F4C430] px-2 py-1 rounded-full font-medium border border-[#2D9B96]">
                            {deck.race}
                          </span>
                        )}
                        <span className="text-xs text-[#4ECDC4] font-medium">
                          {deck.format || 'Imperio Racial'}
                        </span>
                      </div>
                      {deck.user && (
                        <p className="text-xs text-[#A0A0A0] mt-2">
                          por <span className="text-[#4ECDC4] font-medium">{deck.user.username}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {deck.description && (
                      <p className="text-[#A0A0A0] text-sm mb-4 line-clamp-2">{deck.description}</p>
                    )}

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-[#121825] border border-[#2D9B96]/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#F4C430]">
                          {totalCards}
                        </div>
                        <div className="text-xs text-[#4ECDC4] mt-1">Mazo Principal</div>
                      </div>
                      <div className="bg-[#121825] border border-[#2D9B96]/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#F4C430]">
                          {totalSideboard}
                        </div>
                        <div className="text-xs text-[#4ECDC4] mt-1">Sidedeck</div>
                      </div>
                    </div>

                    {/* Footer info */}
                    <div className="text-xs text-[#A0A0A0] mb-4 flex items-center justify-between">
                      <span>Creada: {formatDate(deck.created_at)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLike(deck.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            isLiked
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                              : 'text-[#4ECDC4] hover:text-[#F4C430]'
                          }`}
                          title={isLiked ? 'Quitar like' : 'Dar like'}
                        >
                          <svg
                            className="w-4 h-4"
                            fill={isLiked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span className="font-medium text-xs">{deck.likes_count || 0}</span>
                        </button>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      <Link
                        href={`/decks/${deck.id}?from=community`}
                        className="flex-1 px-4 py-2.5 bg-[#2D9B96] text-white text-center rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium text-sm"
                      >
                        Ver Baraja
                      </Link>
                      <button
                        onClick={() => handleCopy(deck)}
                        className="px-4 py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] text-center rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-[#121825] border border-[#2D9B96] px-4 py-3 flex items-center justify-between sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-[#E8E8E8] bg-[#0A0E1A] border border-[#2D9B96] hover:bg-[#1A2332] disabled:bg-[#0A0E1A] disabled:text-[#707070] disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-[#E8E8E8] bg-[#0A0E1A] border border-[#2D9B96] hover:bg-[#1A2332] disabled:bg-[#0A0E1A] disabled:text-[#707070] disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#4ECDC4]">
                  Mostrando <span className="font-medium text-[#F4C430]">{(currentPage - 1) * 20 + 1}</span> a{' '}
                  <span className="font-medium text-[#F4C430]">
                    {Math.min(currentPage * 20, pagination.totalCount)}
                  </span>{' '}
                  de <span className="font-medium text-[#F4C430]">{pagination.totalCount}</span> mazos
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#2D9B96] bg-[#0A0E1A] text-sm font-medium text-[#4ECDC4] hover:bg-[#1A2332] disabled:bg-[#0A0E1A] disabled:text-[#707070] disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2))
                    const pageNumber = startPage + i
                    if (pageNumber > pagination.totalPages) return null

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === currentPage
                            ? 'z-10 bg-[#F4C430] border-[#F4C430] text-[#0A0E1A]'
                            : 'bg-[#0A0E1A] border-[#2D9B96] text-[#4ECDC4] hover:bg-[#1A2332]'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#2D9B96] bg-[#0A0E1A] text-sm font-medium text-[#4ECDC4] hover:bg-[#1A2332] disabled:bg-[#0A0E1A] disabled:text-[#707070] disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

