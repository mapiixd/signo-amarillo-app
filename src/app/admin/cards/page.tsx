'use client'

import { useState, useEffect } from 'react'
import { SupabaseCard, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import Link from 'next/link'
import Swal from 'sweetalert2'

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<SupabaseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpansion, setSelectedExpansion] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [limit, setLimit] = useState(25) // Cartas por página
  const [searchTerm, setSearchTerm] = useState('')
  const [allExpansions, setAllExpansions] = useState<string[]>([])
  const [expansionsLoading, setExpansionsLoading] = useState(true)

  useEffect(() => {
    fetchExpansions()
  }, [])

  useEffect(() => {
    fetchCards()
  }, [selectedExpansion, currentPage, limit, searchTerm])

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

  const fetchCards = async () => {
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', limit.toString())
      if (selectedExpansion) params.append('expansion', selectedExpansion)
      if (searchTerm) params.append('search', searchTerm)

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusBadge = (card: SupabaseCard) => {
    if (card.is_active) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completada</span>
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cartas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administración de Cartas</h1>
              <p className="text-gray-600 mt-2">
                Gestiona los datos de todas las cartas del formato Imperio
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Inicio
              </Link>
              <Link
                href="/admin/cards/new"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Nueva Carta
              </Link>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Buscador */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Buscar carta:
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Nombre de la carta..."
                  className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 shadow-sm transition-all"
                />
              </div>

              {/* Filtro por expansión */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Filtrar por expansión:
                </label>
                <select
                  value={selectedExpansion}
                  onChange={(e) => handleExpansionChange(e.target.value)}
                  disabled={expansionsLoading}
                  className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 shadow-sm transition-all cursor-pointer"
                >
                  <option value="">
                    {expansionsLoading ? 'Cargando...' : 'Todas las expansiones'}
                  </option>
                  {allExpansions.map(expansion => (
                    <option key={expansion} value={expansion}>{expansion}</option>
                  ))}
                </select>
              </div>

              {/* Límite de cartas */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Cartas por página:
                </label>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 shadow-sm transition-all cursor-pointer"
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
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{pagination?.totalCount || 0}</div>
              <div className="text-sm text-gray-600">Total de cartas</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {cards.filter(card => card.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Completadas (página actual)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {cards.filter(card => !card.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Pendientes (página actual)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{allExpansions.length}</div>
              <div className="text-sm text-gray-600">Expansiones</div>
            </div>
          </div>
        </div>

        {/* Tabla de cartas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuerza/Defensa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rareza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">Sin imagen</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{card.name}</div>
                        <div className="text-sm text-gray-500">{card.expansion}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {card.cost !== null ? card.cost : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {card.attack !== null && card.defense !== null ? (
                        <span className="font-medium">
                          {card.attack}/{card.defense}
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
                      <Link
                        href={`/admin/cards/${card.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </Link>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={async () => {
                          const result = await Swal.fire({
                            icon: 'warning',
                            title: '¿Estás seguro?',
                            text: '¿Quieres eliminar esta carta? Esta acción no se puede deshacer.',
                            showCancelButton: true,
                            confirmButtonColor: '#dc2626',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Sí, eliminar',
                            cancelButtonText: 'Cancelar'
                          })
                          if (result.isConfirmed) {
                            // TODO: Implementar eliminación
                            await Swal.fire({
                              icon: 'info',
                              title: 'Pendiente',
                              text: 'Función de eliminación por implementar',
                              confirmButtonColor: '#2563eb'
                            })
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {selectedExpansion ? `No hay cartas en la expansión "${selectedExpansion}"` : 'No hay cartas registradas'}
              </p>
              <Link
                href="/admin/cards/new"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear primera carta
              </Link>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * limit + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * limit, pagination.totalCount)}
                  </span>{' '}
                  de <span className="font-medium">{pagination.totalCount}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
    </div>
  )
}
