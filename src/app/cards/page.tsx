'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card as CardType } from '@prisma/client'
import { Card } from '@/components/Card'
import Footer from '@/components/Footer'

interface Expansion {
  id: string
  name: string
  display_order: number
}

export default function CardsPage() {
  const [allCards, setAllCards] = useState<CardType[]>([])
  const [displayedCards, setDisplayedCards] = useState<CardType[]>([])
  const [expansions, setExpansions] = useState<Expansion[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [expansionFilter, setExpansionFilter] = useState('')
  const [costFilter, setCostFilter] = useState('')
  const [attackFilter, setAttackFilter] = useState('')
  const [raceFilter, setRaceFilter] = useState('')
  const [abilityText, setAbilityText] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  
  const CARDS_PER_PAGE = 50
  const observerTarget = useRef<HTMLDivElement>(null)

  // Lista de razas disponibles
  const races = [
    'Sombra',
    'Sacerdote',
    'Caballero',
    'Guerrero',
    'Fairie',
    'Eterno',
    'Bestia',
    'Dragón',
    'Héroe'
  ]

  useEffect(() => {
    fetchExpansions()
  }, [])

  useEffect(() => {
    fetchCards()
  }, [search, typeFilter, expansionFilter, costFilter, attackFilter, raceFilter, abilityText])

  useEffect(() => {
    // Actualizar las cartas mostradas cuando cambia la página
    const startIndex = 0
    const endIndex = page * CARDS_PER_PAGE
    setDisplayedCards(allCards.slice(startIndex, endIndex))
  }, [allCards, page])

  // Intersection Observer para infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries
    if (target.isIntersecting && !loadingMore && displayedCards.length < allCards.length) {
      setLoadingMore(true)
      setTimeout(() => {
        setPage(prev => prev + 1)
        setLoadingMore(false)
      }, 300)
    }
  }, [loadingMore, displayedCards.length, allCards.length])

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const option = {
      root: null,
      rootMargin: '400px', // Comienza a cargar 400px antes de llegar al final
      threshold: 0
    }

    const observer = new IntersectionObserver(handleObserver, option)
    observer.observe(element)

    return () => observer.unobserve(element)
  }, [handleObserver])

  const fetchExpansions = async () => {
    try {
      const response = await fetch('/api/expansions')
      if (response.ok) {
        const data = await response.json()
        setExpansions(data)
      }
    } catch (error) {
      console.error('Error fetching expansions:', error)
    }
  }

  const fetchCards = async () => {
    setLoading(true)
    setPage(1) // Reiniciar a la primera página cuando cambian los filtros
    
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter) params.append('type', typeFilter)
      if (expansionFilter) params.append('expansion', expansionFilter)
      if (costFilter) params.append('cost', costFilter)
      if (attackFilter) params.append('attack', attackFilter)
      if (raceFilter) params.append('race', raceFilter)
      if (abilityText) params.append('ability', abilityText)

      const response = await fetch(`/api/cards?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAllCards(data)
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const hasMore = displayedCards.length < allCards.length
  const uniqueTypes = Array.from(new Set(allCards.map(card => card.type)))

  // Solo mostrar pantalla de carga completa en la carga inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4 signo-glow"></div>
          <p className="text-[#4ECDC4] font-medium">Cargando cartas del conocimiento prohibido...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F4C430] mb-6">Colección de Cartas</h1>

          {/* Filtros */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-6 mb-6 border-mystic">
            {/* Filtros básicos */}
            <div className="grid md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Buscar por nombre
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar carta..."
                  className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Tipo
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="">Todos los tipos</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Expansión
                </label>
                <select
                  value={expansionFilter}
                  onChange={(e) => setExpansionFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="">Todas las expansiones</option>
                  {expansions.map(expansion => (
                    <option key={expansion.id} value={expansion.name}>{expansion.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón para mostrar filtros avanzados */}
            <div className="border-t border-[#2D9B96] pt-4">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-[#4ECDC4] hover:text-[#F4C430] font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {showAdvancedFilters ? '▼' : '▶'} Filtros avanzados
              </button>
            </div>

            {/* Filtros avanzados */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-[#2D9B96]">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Coste
                    </label>
                    <select
                      value={costFilter}
                      onChange={(e) => setCostFilter(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                    >
                      <option value="">Cualquier coste</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6+">6 o más</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                      Buscar en habilidad
                    </label>
                    <input
                      type="text"
                      value={abilityText}
                      onChange={(e) => setAbilityText(e.target.value)}
                      placeholder="ej: Furia, Roba, etc..."
                      className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* Filtros específicos para Aliados */}
                {typeFilter === 'ALIADO' && (
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                        Fuerza
                      </label>
                      <select
                        value={attackFilter}
                        onChange={(e) => setAttackFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                      >
                        <option value="">Cualquier fuerza</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7+">7 o más</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                        Raza
                      </label>
                      <select
                        value={raceFilter}
                        onChange={(e) => setRaceFilter(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                      >
                        <option value="">Todas las razas</option>
                        {races.map(race => (
                          <option key={race} value={race}>{race}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-md p-4 mb-6">
            <p className="text-[#E8E8E8] font-medium">
              Mostrando <span className="text-[#F4C430] font-bold">{displayedCards.length}</span> de{' '}
              <span className="text-[#F4C430] font-bold">{allCards.length}</span> carta{allCards.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Grid de cartas */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F4C430] mb-4 signo-glow"></div>
            <p className="text-[#4ECDC4] font-medium text-lg">Aplicando filtros...</p>
          </div>
        ) : displayedCards.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayedCards.map((card) => (
                <Card key={card.id} card={card} />
              ))}
            </div>

            {/* Elemento observador para infinite scroll */}
            <div ref={observerTarget} className="py-8">
              {hasMore && (
                <div className="flex flex-col items-center gap-3">
                  {loadingMore && (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F4C430] signo-glow"></div>
                      <p className="text-[#4ECDC4] font-medium">Cargando más cartas...</p>
                    </>
                  )}
                </div>
              )}
              {!hasMore && allCards.length > CARDS_PER_PAGE && (
                <div className="text-center">
                  <p className="text-[#2D9B96] font-medium">✓ Todas las cartas cargadas</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#A0A0A0] text-lg">No se encontraron cartas</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
