'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { Card as CardType, CARD_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'

interface SelectedCard {
  card: CardType
  quantity: number
}

interface Expansion {
  id: string
  name: string
  display_order: number
}

export default function NewDeckPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raceParam = searchParams.get('race')
  
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<CardType[]>([])
  const [expansions, setExpansions] = useState<Expansion[]>([])
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [sideboard, setSideboard] = useState<SelectedCard[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('Todas')
  const [expansionFilter, setExpansionFilter] = useState<string>('Todas')
  const [deckRace, setDeckRace] = useState<string>(raceParam || '')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'main' | 'sideboard'>('main')

  // Redirigir si no hay raza seleccionada
  useEffect(() => {
    if (!raceParam) {
      router.push('/decks/format-select')
    }
  }, [raceParam, router])

  useEffect(() => {
    fetchCards()
    fetchExpansions()
  }, [])

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards')
      if (response.ok) {
        const data = await response.json()
        setCards(data)
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleAddCard = (card: CardType, toSideboard: boolean = false) => {
    const currentDeck = toSideboard ? sideboard : selectedCards
    const setDeck = toSideboard ? setSideboard : setSelectedCards
    
    const existing = currentDeck.find(sc => sc.card.id === card.id)
    const totalInBothDecks = getTotalCopies(card.id)
    
    // Validar máximo 3 copias en total (mazo principal + refuerzo)
    if (totalInBothDecks >= 3) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: 'No puedes tener más de 3 copias de la misma carta entre el mazo principal y el refuerzo',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }
    
    if (existing) {
      setDeck(currentDeck.map(sc => 
        sc.card.id === card.id ? { ...sc, quantity: sc.quantity + 1 } : sc
      ))
    } else {
      setDeck([...currentDeck, { card, quantity: 1 }])
    }
  }

  const handleRemoveCard = (cardId: string, fromSideboard: boolean = false) => {
    const currentDeck = fromSideboard ? sideboard : selectedCards
    const setDeck = fromSideboard ? setSideboard : setSelectedCards
    
    const existing = currentDeck.find(sc => sc.card.id === cardId)
    if (existing && existing.quantity > 1) {
      setDeck(currentDeck.map(sc => 
        sc.card.id === cardId ? { ...sc, quantity: sc.quantity - 1 } : sc
      ))
    } else {
      setDeck(currentDeck.filter(sc => sc.card.id !== cardId))
    }
  }

  const getTotalCopies = (cardId: string): number => {
    const mainCount = selectedCards.find(sc => sc.card.id === cardId)?.quantity || 0
    const sideCount = sideboard.find(sc => sc.card.id === cardId)?.quantity || 0
    return mainCount + sideCount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la baraja es requerido',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }

    // Validar restricciones del mazo principal
    const validationError = validateMainDeck()
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: validationError,
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }

    // Validar restricciones del mazo de refuerzo
    const sideboardError = validateSideboard()
    if (sideboardError) {
      Swal.fire({
        icon: 'error',
        title: 'Error en el mazo de refuerzo',
        text: sideboardError,
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          is_public: isPublic,
          cards: selectedCards.map(sc => ({
            id: sc.card.id,
            quantity: sc.quantity
          }))
        })
      })

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Baraja creada exitosamente',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430',
          timer: 2000,
          showConfirmButton: false
        })
        router.push('/decks')
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'No se pudo crear la baraja',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
      }
    } catch (error) {
      console.error('Error creating deck:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la baraja',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
    } finally {
      setSaving(false)
    }
  }

  const validateMainDeck = (): string | null => {
    const totalMain = selectedCards.reduce((sum, sc) => sum + sc.quantity, 0)
    
    // Validar que el mazo tenga exactamente 50 cartas
    if (totalMain !== 50) {
      return `El mazo principal debe tener exactamente 50 cartas. Actualmente tiene ${totalMain}.`
    }
    
    // Contar aliados, armas y tótems
    const allyWeaponTotemCount = selectedCards
      .filter(sc => ['ALIADO', 'ARMA', 'TOTEM'].includes(sc.card.type))
      .reduce((sum, sc) => sum + sc.quantity, 0)
    
    if (allyWeaponTotemCount < 17) {
      return `Debes tener al menos 17 cartas entre Aliados, Armas y Tótems. Actualmente tienes ${allyWeaponTotemCount}.`
    }
    
    // Validar máximo 4 aliados sin raza (race === null o vacío)
    const alliesWithoutRace = selectedCards
      .filter(sc => sc.card.type === 'ALIADO' && (!sc.card.race || sc.card.race.trim() === ''))
      .reduce((sum, sc) => sum + sc.quantity, 0)
    
    if (alliesWithoutRace > 4) {
      return `No puedes tener más de 4 aliados sin raza en el mazo principal. Actualmente tienes ${alliesWithoutRace}.`
    }
    
    return null
  }

  const validateSideboard = (): string | null => {
    const totalSideboard = sideboard.reduce((sum, sc) => sum + sc.quantity, 0)
    
    // Validar que el mazo de refuerzo tenga exactamente 15 cartas
    if (totalSideboard > 0 && totalSideboard !== 15) {
      return `El mazo de refuerzo debe tener exactamente 15 cartas si decides usarlo. Actualmente tiene ${totalSideboard}.`
    }
    
    return null
  }

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'Todas' || card.type === typeFilter
    const matchesExpansion = expansionFilter === 'Todas' || card.expansion === expansionFilter
    
    // Filtro por raza del mazo: Si es aliado, solo mostrar los de la raza del mazo o sin raza
    let matchesRace = true
    if (card.type === 'ALIADO') {
      const cardRace = card.race?.trim() || ''
      const hasRace = cardRace !== ''
      
      // Si el aliado tiene raza, debe CONTENER la raza del mazo (para soportar multi-raza)
      if (hasRace) {
        // Verificar si la raza de la carta contiene la raza del mazo
        // Ej: "Bestia, Dragón, Sombra" contiene "Sombra"
        matchesRace = cardRace.includes(deckRace)
      }
      // Si el aliado no tiene raza, siempre se muestra (máximo 4 permitidos)
    }
    // Si no es aliado (Arma, Talismán, Tótem, Oro), siempre se muestra
    
    return matchesSearch && matchesType && matchesExpansion && matchesRace
  })

  const totalCards = selectedCards.reduce((sum, sc) => sum + sc.quantity, 0)
  const totalSideboard = sideboard.reduce((sum, sc) => sum + sc.quantity, 0)
  
  // Obtener tipos únicos
  const cardTypes = ['Todas', ...Array.from(new Set(cards.map(card => card.type)))]

  // Calcular estadísticas del mazo principal
  const allyCount = selectedCards.filter(sc => sc.card.type === 'ALIADO').reduce((sum, sc) => sum + sc.quantity, 0)
  const weaponCount = selectedCards.filter(sc => sc.card.type === 'ARMA').reduce((sum, sc) => sum + sc.quantity, 0)
  const talismanCount = selectedCards.filter(sc => sc.card.type === 'TALISMAN').reduce((sum, sc) => sum + sc.quantity, 0)
  const totemCount = selectedCards.filter(sc => sc.card.type === 'TOTEM').reduce((sum, sc) => sum + sc.quantity, 0)
  const goldCount = selectedCards.filter(sc => sc.card.type === 'ORO').reduce((sum, sc) => sum + sc.quantity, 0)
  const allyWeaponTotemCount = allyCount + weaponCount + totemCount
  const alliesWithoutRace = selectedCards.filter(sc => sc.card.type === 'ALIADO' && (!sc.card.race || sc.card.race.trim() === '')).reduce((sum, sc) => sum + sc.quantity, 0)
  const avgCost = selectedCards.length > 0 
    ? (selectedCards.reduce((sum, sc) => sum + (sc.card.cost || 0) * sc.quantity, 0) / totalCards).toFixed(2)
    : '0.00'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D9B96] mx-auto mb-4"></div>
          <p className="text-[#F4C430]">Cargando cartas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#2D9B96] hover:text-[#4ECDC4] mb-4 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-[#F4C430] mb-2">
            Constructor de Mazos - Raza: {deckRace}
          </h1>
          <p className="text-[#2D9B96] text-sm">
            Formato: Imperio Racial | Solo se mostrarán aliados de raza {deckRace} o sin raza
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* Panel Izquierdo - Selector de Cartas */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-6">
            {/* Barra de búsqueda y filtros */}
            <div className="mb-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg text-white focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder-[#707070]"
                  placeholder="🔍 Buscar carta por nombre..."
                />
              </div>

              {/* Botones de filtro por tipo */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setTypeFilter('Todas')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    typeFilter === 'Todas' 
                      ? 'bg-[#F4C430] text-[#0A0E1A]' 
                      : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#2D9B96] hover:text-white'
                  }`}
                >
                  Todas
                </button>
                {cardTypes.filter(t => t !== 'Todas').map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      typeFilter === type 
                        ? 'bg-[#F4C430] text-[#0A0E1A]' 
                        : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#2D9B96] hover:text-white'
                    }`}
                  >
                    {type === 'ALIADO' && '🗡️'} 
                    {type === 'ARMA' && '⚔️'} 
                    {type === 'TALISMAN' && '✨'} 
                    {type === 'TOTEM' && '🗿'} 
                    {type === 'ORO' && '💰'}
                    {' '}{CARD_TYPE_LABELS[type as keyof typeof CARD_TYPE_LABELS] || type}
                  </button>
                ))}
              </div>

              {/* Filtro por expansión */}
              <div className="mb-4">
                <label className="block text-[#F4C430] font-semibold mb-2 text-sm">
                  Filtrar por Expansión
                </label>
                <select
                  value={expansionFilter}
                  onChange={(e) => setExpansionFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="Todas">Todas las expansiones</option>
                  {expansions.map(expansion => (
                    <option key={expansion.id} value={expansion.name}>
                      {expansion.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid de cartas - Solo imágenes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCards.map(card => {
                const imageUrl = card.image_url ? getCardImageUrl(card.image_url) : null
                const totalCopies = getTotalCopies(card.id)
                
                return (
                  <div
                    key={card.id}
                    className="relative group cursor-pointer"
                    onClick={() => handleAddCard(card, activeTab === 'sideboard')}
                  >
                    <div className="aspect-[3/4] bg-[#1A2332] rounded-lg overflow-hidden border-2 border-[#2D9B96] hover:border-[#F4C430] transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#F4C430]/50">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#4ECDC4] text-xs text-center p-2">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    
                    {/* Badge de cantidad total (principal + refuerzo) */}
                    {totalCopies > 0 && (
                      <div className="absolute -top-2 -right-2 bg-[#F4C430] text-[#0A0E1A] rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-[#2D9B96]">
                        {totalCopies}
                      </div>
                    )}

                    {/* Tooltip con nombre al hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-semibold text-center truncate">
                        {card.name}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#E8E8E8] text-lg">No se encontraron cartas</p>
              </div>
            )}
          </div>

          {/* Panel Derecho - Mazo Actual */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-6 sticky top-4 max-h-[calc(100vh-100px)]">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Input nombre del mazo */}
              <div className="mb-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg text-white font-semibold text-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder-[#707070]"
                  placeholder="Mi Nuevo Mazo"
                  required
                />
              </div>

              {/* Tabs para Mazo Principal y Refuerzo */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'main'
                      ? 'bg-[#2D9B96] text-white'
                      : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#0A0E1A]'
                  }`}
                >
                  Principal ({totalCards}/50)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sideboard')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'sideboard'
                      ? 'bg-[#2D9B96] text-white'
                      : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#0A0E1A]'
                  }`}
                >
                  Refuerzo ({totalSideboard}/15)
                </button>
              </div>

              {/* Estadísticas del mazo principal */}
              {activeTab === 'main' && (
                <div className="bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg p-4 mb-4">
                  <h3 className="text-[#F4C430] font-bold text-xl mb-3 text-center">
                    Total: {totalCards} / 50
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span className="flex items-center gap-2">
                        🗡️ <span className="text-[#2D9B96]">Aliados: {allyCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span className="flex items-center gap-2">
                        ⚔️ <span className="text-[#2D9B96]">Armas: {weaponCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span className="flex items-center gap-2">
                        ✨ <span className="text-[#2D9B96]">Talismanes: {talismanCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span className="flex items-center gap-2">
                        🗿 <span className="text-[#2D9B96]">Tótems: {totemCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span className="flex items-center gap-2">
                        💰 <span className="text-[#F4C430]">Oros: {goldCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8] pt-2 border-t border-[#2D9B96]">
                      <span>Aliados+Armas+Tótems: <span className={allyWeaponTotemCount >= 17 ? 'text-[#2D9B96]' : 'text-[#E74860]'}>{allyWeaponTotemCount}</span></span>
                      <span className="text-[#A0A0A0]">(Mín: 17)</span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span>Aliados sin raza: <span className={alliesWithoutRace <= 4 ? 'text-[#2D9B96]' : 'text-[#E74860]'}>{alliesWithoutRace}</span></span>
                      <span className="text-[#A0A0A0]">(Máx: 4)</span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8] pt-2 border-t border-[#2D9B96]">
                      <span>Costo Prom: {avgCost}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Estadísticas del mazo de refuerzo */}
              {activeTab === 'sideboard' && (
                <div className="bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg p-4 mb-4">
                  <h3 className="text-[#F4C430] font-bold text-xl mb-3 text-center">
                    Total: {totalSideboard} / 15
                  </h3>
                  <p className="text-[#A0A0A0] text-sm text-center">
                    El mazo de refuerzo es opcional y debe tener exactamente 15 cartas
                  </p>
                </div>
              )}

              {/* Lista de cartas seleccionadas */}
              <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
                {(activeTab === 'main' ? selectedCards : sideboard).length > 0 ? (
                  <div className="space-y-2">
                    {(activeTab === 'main' ? selectedCards : sideboard).map(sc => {
                      const imageUrl = sc.card.image_url ? getCardImageUrl(sc.card.image_url) : null
                      const isSideboard = activeTab === 'sideboard'
                      
                      return (
                        <div
                          key={sc.card.id}
                          className="bg-[#1A2332] border border-[#2D9B96] rounded-lg p-2 flex items-center gap-3"
                        >
                          {/* Miniatura de la carta */}
                          <div className="w-12 h-16 bg-[#0A0E1A] rounded overflow-hidden flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={sc.card.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#4ECDC4] text-xs">
                                ?
                              </div>
                            )}
                          </div>

                          {/* Info de la carta */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {sc.card.name}
                            </p>
                            <p className="text-[#A0A0A0] text-xs">
                              {CARD_TYPE_LABELS[sc.card.type as keyof typeof CARD_TYPE_LABELS]}
                              {sc.card.race && ` - ${sc.card.race}`}
                            </p>
                          </div>

                          {/* Controles */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveCard(sc.card.id, isSideboard)}
                              className="text-[#E74860] hover:text-[#FF6B7A] font-bold text-lg w-6 h-6 flex items-center justify-center rounded hover:bg-[#0A0E1A]"
                            >
                              −
                            </button>
                            <span className="text-[#F4C430] font-bold text-lg min-w-[2ch] text-center">
                              {sc.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddCard(sc.card, isSideboard)}
                              className="text-[#2D9B96] hover:text-[#4ECDC4] font-bold text-lg w-6 h-6 flex items-center justify-center rounded hover:bg-[#0A0E1A]"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isSideboard) {
                                  setSideboard(sideboard.filter(c => c.card.id !== sc.card.id))
                                } else {
                                  setSelectedCards(selectedCards.filter(c => c.card.id !== sc.card.id))
                                }
                              }}
                              className="text-[#E74860] hover:text-[#FF6B7A] ml-1"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#A0A0A0]">
                      {activeTab === 'main' 
                        ? 'Selecciona cartas para tu mazo principal' 
                        : 'Selecciona cartas para tu mazo de refuerzo'}
                    </p>
                  </div>
                )}
              </div>

              {/* Toggle público */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer bg-[#1A2332] border border-[#2D9B96] rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 accent-[#2D9B96]"
                  />
                  <span className="text-[#E8E8E8]">Hacer este mazo público</span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={saving || totalCards !== 50}
                  className="w-full px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title={totalCards !== 50 ? 'El mazo principal debe tener exactamente 50 cartas' : ''}
                >
                  {saving ? 'Guardando...' : 'Guardar Mazo'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full px-6 py-3 bg-[#0A0E1A] text-white rounded-lg hover:bg-[#1A2332] transition-all font-semibold border border-[#2D9B96]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A2332;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2D9B96;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4ECDC4;
        }
      `}</style>
    </div>
  )
}

