'use client'

import { useState } from 'react'
import { Card as CardType, DeckCardEntry, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'

type DeckCardEntryWithCard = DeckCardEntry & {
  card: CardType
}

export default function DebugDeckPage() {
  const [mainDeckJson, setMainDeckJson] = useState('')
  const [sideDeckJson, setSideDeckJson] = useState('')
  const [mainDeckCards, setMainDeckCards] = useState<DeckCardEntryWithCard[]>([])
  const [sideDeckCards, setSideDeckCards] = useState<DeckCardEntryWithCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'main' | 'sidedeck'>('main')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedCardForView, setSelectedCardForView] = useState<CardType | null>(null)

  const processDecks = async () => {
    setLoading(true)
    setError(null)
    setMainDeckCards([])
    setSideDeckCards([])

    try {
      // Parsear JSONs
      let mainDeck: DeckCardEntry[] = []
      let sideDeck: DeckCardEntry[] = []

      if (mainDeckJson.trim()) {
        mainDeck = JSON.parse(mainDeckJson)
        if (!Array.isArray(mainDeck)) {
          throw new Error('El main deck debe ser un array')
        }
      }

      if (sideDeckJson.trim()) {
        sideDeck = JSON.parse(sideDeckJson)
        if (!Array.isArray(sideDeck)) {
          throw new Error('El side deck debe ser un array')
        }
      }

      // Extraer todos los IDs únicos
      const allCardIds = [
        ...mainDeck.map(entry => entry.card_id),
        ...sideDeck.map(entry => entry.card_id)
      ]
      const uniqueIds = Array.from(new Set(allCardIds))

      if (uniqueIds.length === 0) {
        setError('No se encontraron IDs de cartas')
        setLoading(false)
        return
      }

      // Obtener las cartas desde la API
      const response = await fetch('/api/cards/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: uniqueIds }),
      })

      if (!response.ok) {
        throw new Error('Error al obtener las cartas')
      }

      const data = await response.json()
      const cardsMap = new Map(data.cards.map((card: CardType) => [card.id, card]))

      // Combinar datos del JSONB con los datos completos de las cartas
      const expandedMainDeck = mainDeck
        .map((entry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id),
        }))
        .filter((c) => c.card) as DeckCardEntryWithCard[]

      const expandedSideDeck = sideDeck
        .map((entry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id),
        }))
        .filter((c) => c.card) as DeckCardEntryWithCard[]

      // Verificar si hay cartas no encontradas
      const mainNotFound = mainDeck.filter(
        (entry) => !cardsMap.has(entry.card_id)
      )
      const sideNotFound = sideDeck.filter(
        (entry) => !cardsMap.has(entry.card_id)
      )

      if (mainNotFound.length > 0 || sideNotFound.length > 0) {
        const notFoundIds = [
          ...mainNotFound.map((e) => e.card_id),
          ...sideNotFound.map((e) => e.card_id),
        ]
        setError(
          `Advertencia: ${notFoundIds.length} carta(s) no encontrada(s): ${notFoundIds.join(', ')}`
        )
      }

      setMainDeckCards(expandedMainDeck)
      setSideDeckCards(expandedSideDeck)
    } catch (err: any) {
      setError(err.message || 'Error al procesar los decks')
      console.error('Error processing decks:', err)
    } finally {
      setLoading(false)
    }
  }

  // Función helper para normalizar el coste
  const normalizeCost = (card: CardType): number => {
    if (card.type === 'ORO') {
      return card.cost ?? 999 // ORO sin coste va al final
    }
    return card.cost ?? 0
  }

  // Función para ordenar cartas
  const sortCards = (cards: DeckCardEntryWithCard[]) => {
    const typeOrder: Record<string, number> = {
      ALIADO: 1,
      TALISMAN: 2,
      ARMA: 3,
      TOTEM: 4,
      ORO: 5,
    }

    return [...cards].sort((a, b) => {
      const typeA = typeOrder[a.card.type] || 999
      const typeB = typeOrder[b.card.type] || 999
      if (typeA !== typeB) return typeA - typeB

      const costA = normalizeCost(a.card)
      const costB = normalizeCost(b.card)
      if (costA !== costB) return costA - costB

      if (a.quantity !== b.quantity) return b.quantity - a.quantity

      return a.card.name.localeCompare(b.card.name, 'es', { sensitivity: 'base' })
    })
  }

  const cardsToDisplay =
    activeTab === 'main'
      ? sortCards(mainDeckCards)
      : sortCards(sideDeckCards)

  // Función para agrupar cartas por tipo para la vista de tabla
  const groupCardsByType = (cards: DeckCardEntryWithCard[]) => {
    const grouped: Record<string, DeckCardEntryWithCard[]> = {
      ALIADO: [],
      ARMA: [],
      TOTEM: [],
      TALISMAN: [],
      ORO: [],
    }

    cards.forEach((entry) => {
      const type = entry.card.type
      if (grouped[type]) {
        grouped[type].push(entry)
      }
    })

    // Ordenar cada grupo por coste y luego por nombre
    Object.keys(grouped).forEach((type) => {
      grouped[type].sort((a, b) => {
        const costA = normalizeCost(a.card)
        const costB = normalizeCost(b.card)
        if (costA !== costB) return costA - costB
        return a.card.name.localeCompare(b.card.name, 'es', { sensitivity: 'base' })
      })
    })

    return grouped
  }

  const cardsByType = groupCardsByType(cardsToDisplay)

  const totalMainDeck = mainDeckCards.reduce((sum, entry) => sum + entry.quantity, 0)
  const totalSideboard = sideDeckCards.reduce((sum, entry) => sum + entry.quantity, 0)

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#F4C430] mb-6">
          Debug de Decks
        </h1>

        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl p-4">
            <label className="block text-[#4ECDC4] font-semibold mb-2">
              Main Deck (JSON)
            </label>
            <textarea
              value={mainDeckJson}
              onChange={(e) => setMainDeckJson(e.target.value)}
              className="w-full h-64 bg-[#1A2332] border border-[#2D9B96] rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-[#4ECDC4]"
              placeholder='[{"card_id": "...", "quantity": 1}, ...]'
            />
          </div>

          <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl p-4">
            <label className="block text-[#4ECDC4] font-semibold mb-2">
              Side Deck (JSON)
            </label>
            <textarea
              value={sideDeckJson}
              onChange={(e) => setSideDeckJson(e.target.value)}
              className="w-full h-64 bg-[#1A2332] border border-[#2D9B96] rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-[#4ECDC4]"
              placeholder='[{"card_id": "...", "quantity": 1}, ...]'
            />
          </div>
        </div>

        {/* Botón de procesar */}
        <div className="mb-6">
          <button
            onClick={processDecks}
            disabled={loading}
            className="px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Procesar Decks'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Visualización de cartas */}
        {(mainDeckCards.length > 0 || sideDeckCards.length > 0) && (
          <div className="space-y-6">
            {/* Stats y Tabs */}
            <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden">
              {/* Stats Row */}
              <div className="grid grid-cols-2 border-b border-[#2D9B96]">
                <div className="p-4 text-center border-r border-[#2D9B96]">
                  <div className="text-3xl font-bold text-[#F4C430] mb-1">
                    {totalMainDeck}
                  </div>
                  <div className="text-sm text-[#4ECDC4]">Cartas en Mazo</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-[#F4C430] mb-1">
                    {totalSideboard}
                  </div>
                  <div className="text-sm text-[#4ECDC4]">Cartas en Sidedeck</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`flex-1 py-3 px-4 font-medium transition-colors ${
                    activeTab === 'main'
                      ? 'bg-[#2D9B96] text-white'
                      : 'bg-[#121825] text-[#A0A0A0] hover:text-[#4ECDC4]'
                  }`}
                >
                  Mazo Principal ({totalMainDeck})
                </button>
                <button
                  onClick={() => setActiveTab('sidedeck')}
                  className={`flex-1 py-3 px-4 font-medium transition-colors ${
                    activeTab === 'sidedeck'
                      ? 'bg-[#2D9B96] text-white'
                      : 'bg-[#121825] text-[#A0A0A0] hover:text-[#4ECDC4]'
                  }`}
                >
                  Sidedeck ({totalSideboard})
                </button>
              </div>
            </div>

            {/* Selector de modo de visualización */}
            <div className="flex justify-end">
              <div className="flex gap-2 bg-[#0F1419] border border-[#2D9B96] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#2D9B96] text-white'
                      : 'text-[#A0A0A0] hover:text-[#4ECDC4]'
                  }`}
                  title="Vista de grid"
                >
                  <i className="fas fa-th"></i>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#2D9B96] text-white'
                      : 'text-[#A0A0A0] hover:text-[#4ECDC4]'
                  }`}
                  title="Vista de tabla"
                >
                  <i className="fas fa-bars"></i>
                </button>
              </div>
            </div>

            {/* Vista Grid o Tabla */}
            {viewMode === 'grid' ? (
              <>
                {/* Grid de Cartas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                  {cardsToDisplay.map((entry) => {
                    if (!entry.card) return null

                    return (
                      <div
                        key={entry.card_id}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedCardForView(entry.card)}
                      >
                        {/* Carta */}
                        <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-[#2D9B96] hover:border-[#4ECDC4]">
                          {(() => {
                            const imagePath = entry.card.image_url || entry.card.image_file
                            const imageUrl = imagePath
                              ? getCardImageUrl(imagePath, entry.card.expansion)
                              : null

                            if (!imageUrl) {
                              return (
                                <div className="w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]">
                                  <span className="text-xs text-[#4ECDC4] text-center px-2">
                                    Sin imagen
                                  </span>
                                </div>
                              )
                            }

                            return (
                              <img
                                src={imageUrl || ''}
                                alt={entry.card.name}
                                className="w-full h-auto object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  const parent = e.currentTarget.parentElement
                                  if (
                                    parent &&
                                    !parent.querySelector('.image-error-placeholder')
                                  ) {
                                    const placeholder = document.createElement('div')
                                    placeholder.className =
                                      'image-error-placeholder w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]'
                                    placeholder.innerHTML =
                                      '<span class="text-xs text-[#4ECDC4] text-center px-2">Error cargando imagen</span>'
                                    parent.appendChild(placeholder)
                                  }
                                }}
                              />
                            )
                          })()}

                          {/* Badge de cantidad */}
                          <div
                            className="absolute bottom-1 right-2 bg-gradient-to-br from-[#0A0E1A] to-[#121825] border-2 border-[#F4C430] rounded-full w-12 h-12 shadow-lg"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '0',
                            }}
                          >
                            <span
                              className="text-xl font-bold text-[#F4C430]"
                              style={{
                                display: 'inline-block',
                                lineHeight: '1',
                                margin: '0',
                                padding: '0',
                                verticalAlign: 'middle',
                              }}
                            >
                              {entry.quantity}
                            </span>
                          </div>

                          {/* Overlay con nombre en hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 w-full">
                              <p className="text-white font-bold text-sm line-clamp-2">
                                {entry.card.name}
                              </p>
                              <p className="text-[#4ECDC4] text-xs mt-1">
                                {CARD_TYPE_LABELS[entry.card.type as keyof typeof CARD_TYPE_LABELS] ||
                                  entry.card.type}{' '}
                                •{' '}
                                {RARITY_TYPE_LABELS[entry.card.rarity as keyof typeof RARITY_TYPE_LABELS] ||
                                  entry.card.rarity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Mensaje si está vacío */}
                {cardsToDisplay.length === 0 && (
                  <div className="text-center py-16 bg-[#0F1419] border border-[#2D9B96] rounded-xl">
                    <div className="text-6xl mb-4">🎴</div>
                    <p className="text-[#A0A0A0] text-lg">
                      {activeTab === 'main'
                        ? 'No hay cartas en el mazo principal'
                        : 'No hay cartas en el sidedeck'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Vista de Tabla */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(['ALIADO', 'ARMA', 'TOTEM', 'TALISMAN', 'ORO'] as const).map((type) => {
                    const cards = cardsByType[type]
                    if (cards.length === 0) return null

                    const typeLabel = CARD_TYPE_LABELS[type] || type
                    const totalQuantity = cards.reduce((sum, entry) => sum + entry.quantity, 0)
                    const isOro = type === 'ORO'

                    return (
                      <div
                        key={type}
                        className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden"
                      >
                        {/* Header de la tabla por tipo */}
                        <div className="bg-[#1A2332] border-b border-[#2D9B96] px-3 py-2">
                          <h3 className="text-base font-bold text-[#F4C430]">
                            {typeLabel} ({totalQuantity})
                          </h3>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-[#121825] border-b border-[#2D9B96]">
                                <th className="px-3 py-2 text-left text-xs font-semibold text-[#4ECDC4]">
                                  Cantidad
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-[#4ECDC4]">
                                  Nombre
                                </th>
                                {!isOro && (
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#4ECDC4]">
                                    Coste
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {cards.map((entry) => {
                                if (!entry.card) return null

                                return (
                                  <tr
                                    key={entry.card_id}
                                    className="border-b border-[#2D9B96]/50 hover:bg-[#1A2332]/50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedCardForView(entry.card)}
                                  >
                                    <td className="px-3 py-2 text-[#F4C430] font-semibold text-sm">
                                      {entry.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-white text-sm">
                                      {entry.card.name}
                                    </td>
                                    {!isOro && (
                                      <td className="px-3 py-2 text-[#4ECDC4] text-sm">
                                        {entry.card.cost !== null ? entry.card.cost : '-'}
                                      </td>
                                    )}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Mensaje si está vacío */}
                {cardsToDisplay.length === 0 && (
                  <div className="text-center py-16 bg-[#0F1419] border border-[#2D9B96] rounded-xl">
                    <div className="text-6xl mb-4">🎴</div>
                    <p className="text-[#A0A0A0] text-lg">
                      {activeTab === 'main'
                        ? 'No hay cartas en el mazo principal'
                        : 'No hay cartas en el sidedeck'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Modal de detalle de carta */}
        {selectedCardForView && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCardForView(null)}
          >
            <div
              className="bg-[#0F1419] border-2 border-[#2D9B96] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#0F1419] border-b border-[#2D9B96] px-4 py-3 flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#F4C430]">
                  {selectedCardForView.name}
                </h2>
                <button
                  onClick={() => setSelectedCardForView(null)}
                  className="text-[#4ECDC4] hover:text-white transition-colors text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {(() => {
                      const imagePath =
                        selectedCardForView.image_url || selectedCardForView.image_file
                      const imageUrl = imagePath
                        ? getCardImageUrl(imagePath, selectedCardForView.expansion)
                        : null

                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={selectedCardForView.name}
                          className="w-full rounded-lg border border-[#2D9B96]"
                        />
                      ) : (
                        <div className="w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96] rounded-lg">
                          <span className="text-[#4ECDC4]">Sin imagen</span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[#4ECDC4] font-semibold">Tipo: </span>
                      <span className="text-white">
                        {CARD_TYPE_LABELS[selectedCardForView.type as keyof typeof CARD_TYPE_LABELS] ||
                          selectedCardForView.type}
                      </span>
                    </div>

                    {selectedCardForView.cost !== null && (
                      <div>
                        <span className="text-[#4ECDC4] font-semibold">Coste: </span>
                        <span className="text-white">{selectedCardForView.cost}</span>
                      </div>
                    )}

                    {selectedCardForView.attack !== null && (
                      <div>
                        <span className="text-[#4ECDC4] font-semibold">Ataque: </span>
                        <span className="text-white">{selectedCardForView.attack}</span>
                      </div>
                    )}

                    {selectedCardForView.defense !== null && (
                      <div>
                        <span className="text-[#4ECDC4] font-semibold">Defensa: </span>
                        <span className="text-white">{selectedCardForView.defense}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-[#4ECDC4] font-semibold">Rareza: </span>
                      <span className="text-white">
                        {RARITY_TYPE_LABELS[selectedCardForView.rarity as keyof typeof RARITY_TYPE_LABELS] ||
                          selectedCardForView.rarity}
                      </span>
                    </div>

                    {selectedCardForView.race && (
                      <div>
                        <span className="text-[#4ECDC4] font-semibold">Raza: </span>
                        <span className="text-white">{selectedCardForView.race}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-[#4ECDC4] font-semibold">Expansión: </span>
                      <span className="text-white">{selectedCardForView.expansion}</span>
                    </div>

                    {selectedCardForView.description && (
                      <div>
                        <span className="text-[#4ECDC4] font-semibold block mb-1">
                          Descripción:
                        </span>
                        <p className="text-white whitespace-pre-wrap">
                          {selectedCardForView.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

