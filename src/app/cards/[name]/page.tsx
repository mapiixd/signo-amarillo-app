'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card as CardType, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'

export default function CardDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const { name } = use(params)
  const decodedName = decodeURIComponent(name)
  
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)

  useEffect(() => {
    if (selectedCard) {
      document.title = `${selectedCard.name} | El Signo Amarillo`;
    } else {
      document.title = 'Detalle de Carta | El Signo Amarillo';
    }
  }, [selectedCard])

  useEffect(() => {
    fetchCardVersions()
  }, [decodedName])

  const fetchCardVersions = async () => {
    try {
      const response = await fetch(`/api/cards/versions?name=${encodeURIComponent(decodedName)}`)
      if (response.ok) {
        const data = await response.json()
        setCards(data)
        if (data.length > 0) {
          setSelectedCard(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching card versions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4 signo-glow"></div>
          <p className="text-[#4ECDC4]">Cargando carta...</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A0A0A0] text-lg mb-4">Carta no encontrada</p>
          <Link
            href="/cards"
            className="px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors signo-glow-cyan"
          >
            Volver a la colección
          </Link>
        </div>
      </div>
    )
  }

  const card = selectedCard || cards[0]

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'ALIADO': return 'bg-[#2D9B96] text-white border border-[#4ECDC4]'
      case 'TALISMAN': return 'bg-[#8B4789] text-white border border-[#A864A8]'
      case 'ARMA': return 'bg-[#B8384E] text-white border border-[#E74860]'
      case 'TOTEM': return 'bg-[#1A7F5A] text-white border border-[#2D9B76]'
      case 'ORO': return 'bg-[#F4C430] text-[#0A0E1A] border border-[#FFD700]'
      default: return 'bg-[#1A2332] text-[#A0A0A0] border border-[#2D3748]'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'VASALLO': return 'bg-[#3B82F6] text-white border border-[#60A5FA]'
      case 'CORTESANO': return 'bg-[#DC2626] text-white border border-[#F87171]'
      case 'REAL': return 'bg-[#EAB308] text-[#0A0E1A] border border-[#FDE047]'
      case 'MEGA_REAL': return 'bg-[#E5E7EB] text-[#1F2937] border border-[#D1D5DB]'
      case 'ULTRA_REAL': return 'bg-[#0A0A0A] text-white border border-[#3F3F46]'
      case 'LEGENDARIA': return 'bg-gradient-to-r from-[#FF6B35] to-[#2D9B96] text-white border border-[#FF8C42] signo-glow'
      case 'PROMO': return 'bg-[#16A34A] text-white border border-[#22C55E]'
      case 'SECRETA': return 'bg-gradient-to-r from-[#8B4789] to-[#2D9B96] text-white border border-[#F4C430] signo-glow'
      default: return 'bg-[#1A2332] text-[#A0A0A0] border border-[#2D3748]'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-8">
        {/* Header con navegación */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link
              href="/cards"
              className="text-[#4ECDC4] hover:text-[#F4C430] font-medium flex items-center gap-2 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la colección
            </Link>
            <h1 className="text-4xl font-bold text-[#F4C430]">{card.name}</h1>
            {cards.length > 1 && (
              <p className="text-[#4ECDC4] mt-2">
                {cards.length} versión{cards.length !== 1 ? 'es' : ''} disponible{cards.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Columna izquierda - Imagen grande */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <div className="bg-[#121825] rounded-xl shadow-lg border-2 border-[#2D9B96] overflow-hidden border-mystic">
                {(() => {
                  const imageUrl = card.image_url ? getCardImageUrl(card.image_url) : null
                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={card.name}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[2/3] flex items-center justify-center bg-gradient-to-br from-[#1A2332] to-[#121825]">
                      <span className="text-[#4ECDC4]">Sin imagen</span>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Columna derecha - Información */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Información principal */}
            <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-4 sm:p-6 border-mystic">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F4C430] mb-4 sm:mb-6">Información de la Carta</h2>
              
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">Tipo</label>
                  <span className={`inline-block px-4 py-2 rounded-lg border-2 font-medium ${getTypeColor(card.type)}`}>
                    {CARD_TYPE_LABELS[card.type as keyof typeof CARD_TYPE_LABELS] || card.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">Rareza</label>
                  <span className={`inline-block px-4 py-2 rounded-lg border-2 font-medium ${getRarityColor(card.rarity)}`}>
                    {RARITY_TYPE_LABELS[card.rarity as keyof typeof RARITY_TYPE_LABELS] || card.rarity}
                  </span>
                </div>

                {card.cost !== null && (
                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">Coste</label>
                    <div className="text-3xl font-bold text-[#F4C430]">{card.cost}</div>
                  </div>
                )}

                {card.attack !== null && (
                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">Fuerza</label>
                    <div className="text-3xl font-bold text-[#E74860]">{card.attack}</div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">Expansión</label>
                  <p className="text-[#E8E8E8] font-medium">{card.expansion}</p>
                </div>
              </div>

              {card.description && (
                <div className="mt-6 pt-6 border-t border-[#2D9B96]">
                  <label className="block text-sm font-semibold text-[#4ECDC4] mb-2">Habilidad</label>
                  <p className="text-white leading-relaxed">{card.description}</p>
                </div>
              )}
            </div>

            {/* Otras versiones */}
            {cards.length > 1 && (
              <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-4 sm:p-6 border-mystic">
                <h2 className="text-xl sm:text-2xl font-bold text-[#F4C430] mb-3 sm:mb-4">
                  Versiones e Ilustraciones ({cards.length})
                </h2>
                <p className="text-[#A0A0A0] mb-4 sm:mb-6 text-sm sm:text-base">
                  Esta carta tiene {cards.length} versiones diferentes. Haz clic en una para verla en detalle.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {cards.map((version, index) => {
                    const rarityColor = getRarityColor(version.rarity)
                    return (
                      <button
                        key={version.id}
                        onClick={() => setSelectedCard(version)}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all text-left bg-[#1A2332] ${
                          selectedCard?.id === version.id
                            ? 'border-[#F4C430] ring-4 ring-[#F4C430]/20 shadow-lg signo-glow'
                            : 'border-[#2D9B96] hover:border-[#4ECDC4] hover:shadow-md'
                        }`}
                      >
                        <div className="flex gap-3 p-3">
                          {/* Miniatura */}
                          <div className="w-20 flex-shrink-0">
                            <div className="aspect-[2/3] bg-[#121825] rounded overflow-hidden border border-[#1A7F7A]">
                              {(() => {
                                const imageUrl = version.image_url ? getCardImageUrl(version.image_url) : null
                                return imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={`${version.name} - ${version.expansion}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-xs text-[#4ECDC4]">Sin imagen</span>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-sm text-[#F4C430] line-clamp-2">
                                Versión {index + 1}
                              </h3>
                              {selectedCard?.id === version.id && (
                                <div className="flex-shrink-0 bg-[#F4C430] text-[#0A0E1A] rounded-full p-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-xs text-[#2D9B96] mb-2 line-clamp-1">
                              {version.expansion}
                            </p>

                            <div className="flex flex-wrap gap-1">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${rarityColor}`}>
                                {RARITY_TYPE_LABELS[version.rarity as keyof typeof RARITY_TYPE_LABELS]}
                              </span>
                              {version.cost !== null && (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#2D9B96] text-white">
                                  Coste: {version.cost}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mensaje si solo hay una versión */}
            {cards.length === 1 && (
              <div className="bg-[#1A2332] border border-[#2D9B96] rounded-lg p-4">
                <p className="text-[#4ECDC4] text-sm">
                  ℹ️ Esta carta solo tiene una versión disponible.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

