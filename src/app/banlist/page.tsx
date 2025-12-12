'use client'

import { useState, useEffect } from 'react'
import { BANLISTS, getBanStatusLabel, getBanStatusIcon, type FormatType } from '@/lib/banlist'
import { getCardImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'
import type { Card } from '@/types'

interface CardWithImage extends Card {
  banStatus?: 'banned' | 'limited-1' | 'limited-2'
}

export default function BanlistPage() {
  const formats: FormatType[] = ['Imperio Racial', 'VCR', 'Triadas']
  const [cardsMap, setCardsMap] = useState<Map<string, CardWithImage>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanlistCards()
  }, [])

  const fetchBanlistCards = async () => {
    try {
      setLoading(true)
      
      // Obtener todas las cartas de la banlist en una sola petición
      const response = await fetch('/api/cards/banlist')
      if (!response.ok) {
        throw new Error('Error al obtener las cartas')
      }
      
      const data = await response.json()
      const cardsData: Card[] = data.cards || []

      // Crear un mapa con el estado de ban para cada carta
      const map = new Map<string, CardWithImage>()
      formats.forEach(format => {
        BANLISTS[format].forEach(entry => {
          // Buscar la carta por nombre (coincidencia exacta o parcial)
          const card = cardsData.find(c => {
            const cardNameLower = c.name.toLowerCase().trim()
            const entryNameLower = entry.cardName.toLowerCase().trim()
            return cardNameLower === entryNameLower ||
                   cardNameLower.includes(entryNameLower) ||
                   entryNameLower.includes(cardNameLower)
          })
          
          if (card) {
            map.set(entry.cardName, { ...card, banStatus: entry.status })
          } else {
            // Si no encontramos la carta, crear una entrada básica
            map.set(entry.cardName, {
              id: '',
              name: entry.cardName,
              type: 'ALIADO' as any,
              cost: null,
              attack: null,
              defense: null,
              description: null,
              image_url: null,
              image_file: null,
              rarity: 'VASALLO' as any,
              race: null,
              expansion: '',
              is_active: true,
              created_at: '',
              updated_at: '',
              banStatus: entry.status
            })
          }
        })
      })

      setCardsMap(map)
    } catch (error) {
      console.error('Error fetching banlist cards:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4C430] mb-2">Banlist Actual</h1>
          <p className="text-[#A0A0A0] text-sm sm:text-base">
            Cartas prohibidas y limitadas por formato
          </p>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-[#4ECDC4]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4ECDC4]"></div>
              <span className="text-sm">Cargando imágenes de cartas...</span>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {formats.map((format) => {
            const banlist = BANLISTS[format]
            const banned = banlist.filter(c => c.status === 'banned')
            const limited1 = banlist.filter(c => c.status === 'limited-1')
            const limited2 = banlist.filter(c => c.status === 'limited-2')

            return (
              <div
                key={format}
                className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-md overflow-hidden"
              >
                {/* Header del formato */}
                <div className="bg-[#1A2332] border-b border-[#2D9B96] px-6 py-4">
                  <h2 className="text-xl font-bold text-[#F4C430]">{format}</h2>
                  <p className="text-sm text-[#4ECDC4] mt-1">
                    {banned.length} prohibidas • {limited1.length} limitadas a 1 • {limited2.length} limitadas a 2
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Cartas Prohibidas */}
                  {banned.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                        <span>⛔</span>
                        <span>Prohibidas ({banned.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {banned.map((entry) => {
                          const card = cardsMap.get(entry.cardName)
                          const imageUrl = card && (card.image_url || card.image_file) 
                            ? getCardImageUrl(card.image_url || card.image_file, card.expansion) 
                            : null
                          
                          return (
                            <div
                              key={entry.cardName}
                              className="bg-[#0A0E1A] border-2 border-red-600/50 rounded-lg overflow-hidden hover:border-red-500 transition-all hover:shadow-lg"
                            >
                              {/* Imagen de la carta */}
                              <div className="aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center overflow-hidden relative">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={entry.cardName}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget
                                      target.style.display = 'none'
                                      const parent = target.parentElement
                                      if (parent && !parent.querySelector('.error-message')) {
                                        const errorDiv = document.createElement('div')
                                        errorDiv.className = 'error-message text-[#4ECDC4] text-xs text-center px-2'
                                        errorDiv.textContent = 'Sin imagen'
                                        parent.appendChild(errorDiv)
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="text-[#4ECDC4] text-xs text-center px-2">
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                              {/* Nombre y estado */}
                              <div className="p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#E8E8E8] font-medium text-xs line-clamp-2 flex-1">{entry.cardName}</span>
                                  <span className="text-red-400 text-xs font-bold ml-2">0</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cartas Limitadas a 1 */}
                  {limited1.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span>
                        <span>Limitadas a 1 copia ({limited1.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {limited1.map((entry) => {
                          const card = cardsMap.get(entry.cardName)
                          const imageUrl = card && (card.image_url || card.image_file) 
                            ? getCardImageUrl(card.image_url || card.image_file, card.expansion) 
                            : null
                          
                          return (
                            <div
                              key={entry.cardName}
                              className="bg-[#0A0E1A] border-2 border-yellow-600/50 rounded-lg overflow-hidden hover:border-yellow-500 transition-all hover:shadow-lg"
                            >
                              {/* Imagen de la carta */}
                              <div className="aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center overflow-hidden relative">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={entry.cardName}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget
                                      target.style.display = 'none'
                                      const parent = target.parentElement
                                      if (parent && !parent.querySelector('.error-message')) {
                                        const errorDiv = document.createElement('div')
                                        errorDiv.className = 'error-message text-[#4ECDC4] text-xs text-center px-2'
                                        errorDiv.textContent = 'Sin imagen'
                                        parent.appendChild(errorDiv)
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="text-[#4ECDC4] text-xs text-center px-2">
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                              {/* Nombre y estado */}
                              <div className="p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#E8E8E8] font-medium text-xs line-clamp-2 flex-1">{entry.cardName}</span>
                                  <span className="text-yellow-400 text-xs font-bold ml-2">1</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cartas Limitadas a 2 */}
                  {limited2.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                        <span>🔶</span>
                        <span>Limitadas a 2 copias ({limited2.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {limited2.map((entry) => {
                          const card = cardsMap.get(entry.cardName)
                          const imageUrl = card && (card.image_url || card.image_file) 
                            ? getCardImageUrl(card.image_url || card.image_file, card.expansion) 
                            : null
                          
                          return (
                            <div
                              key={entry.cardName}
                              className="bg-[#0A0E1A] border-2 border-orange-600/50 rounded-lg overflow-hidden hover:border-orange-500 transition-all hover:shadow-lg"
                            >
                              {/* Imagen de la carta */}
                              <div className="aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center overflow-hidden relative">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={entry.cardName}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget
                                      target.style.display = 'none'
                                      const parent = target.parentElement
                                      if (parent && !parent.querySelector('.error-message')) {
                                        const errorDiv = document.createElement('div')
                                        errorDiv.className = 'error-message text-[#4ECDC4] text-xs text-center px-2'
                                        errorDiv.textContent = 'Sin imagen'
                                        parent.appendChild(errorDiv)
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="text-[#4ECDC4] text-xs text-center px-2">
                                    Sin imagen
                                  </div>
                                )}
                              </div>
                              {/* Nombre y estado */}
                              <div className="p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[#E8E8E8] font-medium text-xs line-clamp-2 flex-1">{entry.cardName}</span>
                                  <span className="text-orange-400 text-xs font-bold ml-2">2</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay restricciones */}
                  {banned.length === 0 && limited1.length === 0 && limited2.length === 0 && (
                    <div className="text-center py-8 text-[#4ECDC4]">
                      No hay cartas restringidas en este formato
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  )
}

