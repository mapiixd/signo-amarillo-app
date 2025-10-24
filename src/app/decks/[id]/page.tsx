'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DeckWithCards, Card as CardType } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'
import html2canvas from 'html2canvas'

export default function DeckViewPage() {
  const params = useParams()
  const router = useRouter()
  const [deck, setDeck] = useState<DeckWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'main' | 'sidedeck'>('main')
  const [exporting, setExporting] = useState(false)
  const deckViewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params.id) {
      fetchDeck(params.id as string)
    }
  }, [params.id])

  const fetchDeck = async (id: string) => {
    try {
      const response = await fetch('/api/decks')
      if (response.ok) {
        const decks = await response.json()
        const foundDeck = decks.find((d: DeckWithCards) => d.id === id)
        if (foundDeck) {
          setDeck(foundDeck)
        }
      }
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
          <p className="text-[#4ECDC4]">Cargando baraja...</p>
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A0A0A0] text-lg mb-4">Baraja no encontrada</p>
          <button
            onClick={() => router.push('/decks')}
            className="px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors"
          >
            Volver a Mis Barajas
          </button>
        </div>
      </div>
    )
  }

  const totalMainDeck = deck.cards.reduce((sum, entry) => sum + entry.quantity, 0)
  const totalSideboard = deck.sideboard.reduce((sum, entry) => sum + entry.quantity, 0)

  // Función para ordenar cartas
  const sortCards = (cards: typeof deck.cards) => {
    const typeOrder: Record<string, number> = {
      'ALIADO': 1,
      'ARMA': 2,
      'TOTEM': 3,
      'TALISMAN': 4,
      'ORO': 5
    }

    return [...cards].sort((a, b) => {
      // Primero por tipo
      const typeA = typeOrder[a.card.type] || 999
      const typeB = typeOrder[b.card.type] || 999
      if (typeA !== typeB) return typeA - typeB

      // Si ambos son ORO, "Oro Inicial" va al final
      if (a.card.type === 'ORO' && b.card.type === 'ORO') {
        const isAOroInicial = a.card.name.toLowerCase().includes('oro inicial') || 
                             (a.card.description?.toLowerCase().includes('oro inicial') ?? false)
        const isBOroInicial = b.card.name.toLowerCase().includes('oro inicial') || 
                             (b.card.description?.toLowerCase().includes('oro inicial') ?? false)
        if (isAOroInicial && !isBOroInicial) return 1
        if (!isAOroInicial && isBOroInicial) return -1
      }

      // Luego por coste (1 > 2 > 3 > ..., null al final)
      const costA = a.card.cost ?? 999
      const costB = b.card.cost ?? 999
      if (costA !== costB) return costA - costB

      // Luego por cantidad (3 > 2 > 1)
      if (a.quantity !== b.quantity) return b.quantity - a.quantity

      // Finalmente por nombre alfabético
      return a.card.name.localeCompare(b.card.name)
    })
  }

  const cardsToDisplay = activeTab === 'main' 
    ? sortCards(deck.cards) 
    : sortCards(deck.sideboard)

  const handleExportImage = async () => {
    if (!deckViewRef.current || !deck) return
    
    setExporting(true)
    
    try {
      // Capturar el elemento como canvas
      const canvas = await html2canvas(deckViewRef.current, {
        backgroundColor: '#0A0E1A',
        scale: 2, // Mayor calidad
        logging: false,
        useCORS: true,
        allowTaint: true
      })
      
      // Convertir a blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Crear URL temporal
          const url = URL.createObjectURL(blob)
          
          // Crear link de descarga
          const link = document.createElement('a')
          link.download = `${deck.name.replace(/[^a-z0-9]/gi, '_')}_${activeTab}.png`
          link.href = url
          link.click()
          
          // Limpiar
          URL.revokeObjectURL(url)
        }
        setExporting(false)
      })
    } catch (error) {
      console.error('Error al exportar imagen:', error)
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#2D9B96] hover:text-[#4ECDC4] mb-4 flex items-center gap-2 transition-colors"
          >
            ← Volver
          </button>
          
          <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden mb-6">
            {/* Header con imagen de fondo */}
            <div className="relative bg-[#1A2332] p-6 overflow-hidden min-h-[140px]">
              {/* Imagen de fondo grande */}
              {deck.race && (
                <img 
                  src={`/razas/${deck.race}.png`} 
                  alt={deck.race}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  style={deck.race === 'Sombra' ? { objectPosition: '50% 15%' } : undefined}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              
              {/* Contenido sobre la imagen */}
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[#F4C430] mb-2 drop-shadow-lg">{deck.name}</h1>
                  
                  {deck.description && (
                    <p className="text-[#A0A0A0] mb-3 drop-shadow">{deck.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {deck.race && (
                      <span className="bg-[#0A0E1A] text-[#F4C430] px-3 py-1 rounded-full font-medium border border-[#2D9B96]">
                        {deck.race}
                      </span>
                    )}
                    <span className="text-[#4ECDC4] font-medium">
                      {deck.format || 'Imperio Racial'}
                    </span>
                    <span className="text-[#A0A0A0]">
                      Creada: {new Date(deck.created_at).toLocaleDateString('es-ES')}
                    </span>
                    {deck.is_public && (
                      <span className="text-[#4ECDC4]">🌐 Pública</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleExportImage}
                    disabled={exporting}
                    className="px-5 py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? '📸 Exportando...' : '📸 Exportar Imagen'}
                  </button>
                  <button
                    onClick={() => router.push(`/decks/${deck.id}/edit`)}
                    className="px-5 py-2.5 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium shadow-lg"
                  >
                    Editar Baraja
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats y Tabs */}
          <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden">
            {/* Stats Row */}
            <div className="grid grid-cols-2 border-b border-[#2D9B96]">
              <div className="p-4 text-center border-r border-[#2D9B96]">
                <div className="text-3xl font-bold text-[#F4C430] mb-1">{totalMainDeck}</div>
                <div className="text-sm text-[#4ECDC4]">Cartas en Mazo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-3xl font-bold text-[#F4C430] mb-1">{totalSideboard}</div>
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
        </div>

        {/* Grid de Cartas */}
        <div ref={deckViewRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {cardsToDisplay.map((entry) => {
            // Verificar que la carta existe
            if (!entry.card) {
              console.error('Card not found for entry:', entry)
              return null
            }
            
            return (
              <div
                key={entry.card_id}
                className="relative group"
              >
                {/* Carta */}
                <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-[#2D9B96] hover:border-[#4ECDC4]">
                  <img
                    src={getCardImageUrl(entry.card.image_file || '', entry.card.expansion)}
                    alt={entry.card.name}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Error loading image:', entry.card.name, entry.card.image_file, entry.card.expansion)
                    }}
                  />
                  
                  {/* Badge de cantidad */}
                  <div className="absolute bottom-2 right-2 bg-gradient-to-br from-[#0A0E1A] to-[#121825] border-2 border-[#F4C430] rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-[#F4C430]">
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
                        {entry.card.type} • {entry.card.rarity}
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
      </div>

      <Footer />
    </div>
  )
}

