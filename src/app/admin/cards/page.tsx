'use client'

import { useState, useEffect } from 'react'
import { SupabaseCard, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { getCardThumbnailUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function AdminCardsPage() {
  useEffect(() => {
    document.title = 'Administrar Cartas | El Signo Amarillo';
  }, [])

  const [cards, setCards] = useState<SupabaseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpansion, setSelectedExpansion] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [limit, setLimit] = useState(25) // Cartas por página
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedRace, setSelectedRace] = useState<string>('')
  const [selectedRarity, setSelectedRarity] = useState<string>('')
  const [allExpansions, setAllExpansions] = useState<string[]>([])
  const [allRaces, setAllRaces] = useState<string[]>([])
  const [expansionsLoading, setExpansionsLoading] = useState(true)

  useEffect(() => {
    const savedState = sessionStorage.getItem('adminCardsState')
    if (savedState) {
      const { expansion, page, limit: savedLimit, search, type, race, rarity } = JSON.parse(savedState)
      setSelectedExpansion(expansion || '')
      setCurrentPage(page || 1)
      setLimit(savedLimit || 25)
      setSearchTerm(search || '')
      setSelectedType(type || '')
      setSelectedRace(race || '')
      setSelectedRarity(rarity || '')
      sessionStorage.removeItem('adminCardsState')
    }
    fetchExpansions()
    fetchRaces()
  }, [])

  useEffect(() => {
    fetchCards()
  }, [selectedExpansion, currentPage, limit, searchTerm, selectedType, selectedRace, selectedRarity])

  useEffect(() => {
    sessionStorage.setItem('adminCardsState', JSON.stringify({
      expansion: selectedExpansion,
      page: currentPage,
      limit,
      search: searchTerm,
      type: selectedType,
      race: selectedRace,
      rarity: selectedRarity
    }))
  }, [selectedExpansion, currentPage, limit, searchTerm, selectedType, selectedRace, selectedRarity])

  const fetchExpansions = async () => {
    try {
      const response = await fetch('/api/admin/cards/expansions')
      if (response.ok) {
        const data = await response.json()
        setAllExpansions(data.expansions)
      }
    } catch (error) {
      console.error('Error fetching expansions:', error)
    } finally {
      setExpansionsLoading(false)
    }
  }

  const fetchRaces = async () => {
    try {
      // Obtener todas las razas únicas de las cartas usando una consulta específica
      // Primero intentamos obtener todas las cartas con paginación grande para obtener razas
      const response = await fetch('/api/admin/cards?limit=1000')
      if (response.ok) {
        const data = await response.json()
        const uniqueRaces = Array.from(new Set(
          data.cards
            .map((card: SupabaseCard) => card.race)
            .filter((race: string | null) => race && race.trim() !== '')
        )).sort() as string[]
        setAllRaces(uniqueRaces)
        
        // Si hay más páginas, obtener más razas
        if (data.pagination && data.pagination.totalPages > 1) {
          // Obtener más páginas para asegurar todas las razas
          const allRacesSet = new Set(uniqueRaces)
          for (let page = 2; page <= Math.min(10, data.pagination.totalPages); page++) {
            const pageResponse = await fetch(`/api/admin/cards?limit=1000&page=${page}`)
            if (pageResponse.ok) {
              const pageData = await pageResponse.json()
              pageData.cards.forEach((card: SupabaseCard) => {
                if (card.race && card.race.trim() !== '') {
                  allRacesSet.add(card.race)
                }
              })
            }
          }
          setAllRaces(Array.from(allRacesSet).sort())
        }
      }
    } catch (error) {
      console.error('Error fetching races:', error)
      // Fallback: usar las razas predefinidas si hay error
      setAllRaces(['Bestia', 'Caballero', 'Dragón', 'Eterno', 'Faerie', 'Guerrero', 'Héroe', 'Sacerdote', 'Sombra', 'Sin Raza'])
    }
  }

  const fetchCards = async () => {
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', limit.toString())
      if (selectedExpansion) params.append('expansion', selectedExpansion)
      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('type', selectedType)
      if (selectedRace) params.append('race', selectedRace)
      if (selectedRarity) params.append('rarity', selectedRarity)

      const response = await fetch(`/api/admin/cards?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCards(data.cards)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExpansionChange = (expansion: string) => {
    setSelectedExpansion(expansion)
    setCurrentPage(1) // Resetear a página 1 cuando cambie el filtro
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1) // Resetear a página 1 cuando cambie el límite
  }

  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    setCurrentPage(1) // Resetear a página 1 cuando cambie la búsqueda
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setCurrentPage(1)
  }

  const handleRaceChange = (race: string) => {
    setSelectedRace(race)
    setCurrentPage(1)
  }

  const handleRarityChange = (rarity: string) => {
    setSelectedRarity(rarity)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusBadge = (card: SupabaseCard) => {
    if (card.is_active) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completada</span>
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
          <p className="text-[#4ECDC4]">Cargando cartas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#F4C430]">Administración de Cartas</h1>
              <p className="text-[#4ECDC4] mt-2">
                Gestiona los datos de todas las cartas del formato Imperio
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-6 py-3 bg-[#121825] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#1A2332] transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Inicio
              </Link>
              <Link
                href="/admin/cards/new"
                className="px-6 py-3 bg-[#F4C430] text-[#0A0E1A] rounded-lg hover:bg-[#FFD700] transition-colors font-medium signo-glow"
              >
                Nueva Carta
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Buscador */}
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Buscar carta:
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Nombre de la carta..."
                  className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] placeholder-[#707070] shadow-sm transition-all"
                />
              </div>

              {/* Filtro por expansión */}
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Expansión:
                </label>
                <select
                  value={selectedExpansion}
                  onChange={(e) => handleExpansionChange(e.target.value)}
                  disabled={expansionsLoading}
                  className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] disabled:bg-[#121825] disabled:text-[#707070] shadow-sm transition-all cursor-pointer"
                >
                  <option value="">
                    {expansionsLoading ? 'Cargando...' : 'Todas las expansiones'}
                  </option>
                  {allExpansions.map(expansion => (
                    <option key={expansion} value={expansion}>{expansion}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por tipo */}
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Tipo:
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por raza */}
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Raza:
                </label>
                <select
                  value={selectedRace}
                  onChange={(e) => handleRaceChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="">Todas las razas</option>
                  {allRaces.map(race => (
                    <option key={race} value={race}>{race}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por rareza */}
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Rareza:
                </label>
                <select
                  value={selectedRarity}
                  onChange={(e) => handleRarityChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="">Todas las rarezas</option>
                  {Object.entries(RARITY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Límite de cartas */}
              <div>
                <label className="block text-sm font-semibold text-[#F4C430] mb-2">
                  Cartas por página:
                </label>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-[#0A0E1A] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-[#F4C430]">{pagination?.totalCount || 0}</div>
              <div className="text-sm text-[#4ECDC4]">Total de cartas</div>
            </div>
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-400">
                {cards.filter(card => card.is_active).length}
              </div>
              <div className="text-sm text-[#4ECDC4]">Completadas (página actual)</div>
            </div>
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {cards.filter(card => !card.is_active).length}
              </div>
              <div className="text-sm text-[#4ECDC4]">Pendientes (página actual)</div>
            </div>
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-400">{allExpansions.length}</div>
              <div className="text-sm text-[#4ECDC4]">Expansiones</div>
            </div>
          </div>
        </div>

        {/* Tabla de cartas */}
        <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#2D9B96]">
              <thead className="bg-[#0A0E1A]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Coste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Fuerza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Raza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Rareza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#F4C430] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#121825] divide-y divide-[#2D9B96]">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-[#1A2332]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-16 bg-[#0A0E1A] rounded flex items-center justify-center">
                        {(() => {
                          const thumbnailUrl = card.image_url ? getCardThumbnailUrl(card.image_url) : null
                          return thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={card.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-xs text-[#707070]">Sin imagen</span>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#E8E8E8]">{card.name}</div>
                        <div className="text-sm text-[#4ECDC4]">{card.expansion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        card.type === 'ALIADO' ? 'bg-blue-100 text-blue-800' :
                        card.type === 'TALISMAN' ? 'bg-purple-100 text-purple-800' :
                        card.type === 'ARMA' ? 'bg-red-100 text-red-800' :
                        card.type === 'TOTEM' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {CARD_TYPE_LABELS[card.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E8E8E8]">
                      {card.cost !== null ? card.cost : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E8E8E8]">
                      {card.attack !== null ? (
                        <span className="font-medium">
                          {card.attack}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#E8E8E8]">
                      {card.race ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4]">
                          {card.race}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        card.rarity === 'VASALLO' ? 'bg-blue-100 text-blue-800' :
                        card.rarity === 'CORTESANO' ? 'bg-red-100 text-red-800' :
                        card.rarity === 'REAL' ? 'bg-yellow-100 text-yellow-800' :
                        card.rarity === 'MEGA_REAL' ? 'bg-white text-gray-800 border border-gray-300' :
                        card.rarity === 'ULTRA_REAL' ? 'bg-black text-white' :
                        card.rarity === 'LEGENDARIA' ? 'bg-orange-100 text-orange-800' :
                        card.rarity === 'PROMO' ? 'bg-green-100 text-green-800' :
                        card.rarity === 'SECRETA' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {RARITY_TYPE_LABELS[card.rarity as keyof typeof RARITY_TYPE_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(card)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/cards/${card.id}/edit`}
                          className="text-[#4ECDC4] hover:text-[#F4C430] transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          className="text-red-400 hover:text-red-300 transition-colors text-left"
                          onClick={async () => {
                            const result = await Swal.fire({
                              icon: 'warning',
                              title: '¿Estás seguro?',
                              text: `¿Quieres eliminar la carta "${card.name}"? Esta acción no se puede deshacer.`,
                              showCancelButton: true,
                              confirmButtonColor: '#dc2626',
                              cancelButtonColor: '#6b7280',
                              confirmButtonText: 'Sí, eliminar',
                              cancelButtonText: 'Cancelar',
                              background: '#121825',
                              color: '#E8E8E8'
                            })
                            if (result.isConfirmed) {
                              try {
                                const response = await fetch(`/api/admin/cards/${card.id}`, {
                                  method: 'DELETE'
                                })

                                if (!response.ok) {
                                  const errorData = await response.json()
                                  throw new Error(errorData.error || 'Error al eliminar la carta')
                                }

                                await Swal.fire({
                                  icon: 'success',
                                  title: '¡Eliminada!',
                                  text: `La carta "${card.name}" ha sido eliminada exitosamente`,
                                  confirmButtonColor: '#2D9B96',
                                  background: '#121825',
                                  color: '#F4C430',
                                  timer: 2000,
                                  showConfirmButton: false
                                })

                                // Recargar las cartas después de eliminar
                                fetchCards()
                              } catch (error: any) {
                                console.error('Error deleting card:', error)
                                await Swal.fire({
                                  icon: 'error',
                                  title: 'Error',
                                  text: error.message || 'No se pudo eliminar la carta',
                                  confirmButtonColor: '#dc2626',
                                  background: '#121825',
                                  color: '#E8E8E8'
                                })
                              }
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#4ECDC4] text-lg">
                {selectedExpansion ? `No hay cartas en la expansión "${selectedExpansion}"` : 'No hay cartas registradas'}
              </p>
              <Link
                href="/admin/cards/new"
                className="inline-block mt-4 px-6 py-3 bg-[#F4C430] text-[#0A0E1A] rounded-lg hover:bg-[#FFD700] transition-colors signo-glow"
              >
                Crear primera carta
              </Link>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-[#121825] border border-[#2D9B96] px-4 py-3 flex items-center justify-between sm:px-6 mt-4 rounded-lg shadow">
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
                  Mostrando <span className="font-medium text-[#F4C430]">{(currentPage - 1) * limit + 1}</span> a{' '}
                  <span className="font-medium text-[#F4C430]">
                    {Math.min(currentPage * limit, pagination.totalCount)}
                  </span>{' '}
                  de <span className="font-medium text-[#F4C430]">{pagination.totalCount}</span> resultados
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

                  {/* Páginas */}
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
