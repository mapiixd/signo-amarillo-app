'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card as CardType } from '@prisma/client'
import { CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'

export default function CardDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const { name } = use(params)
  const decodedName = decodeURIComponent(name)
  
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando carta...</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Carta no encontrada</p>
          <Link
            href="/cards"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      case 'ALIADO': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'TALISMAN': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'ARMA': return 'bg-red-100 text-red-800 border-red-300'
      case 'TOTEM': return 'bg-green-100 text-green-800 border-green-300'
      case 'ORO': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'VASALLO': return 'bg-blue-100 text-blue-800'
      case 'CORTESANO': return 'bg-red-100 text-red-800'
      case 'REAL': return 'bg-yellow-100 text-yellow-800'
      case 'MEGA_REAL': return 'bg-white text-gray-800 border border-gray-300'
      case 'ULTRA_REAL': return 'bg-black text-white'
      case 'LEGENDARIA': return 'bg-orange-100 text-orange-800'
      case 'PROMO': return 'bg-green-100 text-green-800'
      case 'SECRETA': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header con navegación */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link
              href="/cards"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la colección
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">{card.name}</h1>
            {cards.length > 1 && (
              <p className="text-gray-600 mt-2">
                {cards.length} versión{cards.length !== 1 ? 'es' : ''} disponible{cards.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Imagen grande */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="aspect-[2/3] flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-gray-500">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Información */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información principal */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de la Carta</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                  <span className={`inline-block px-4 py-2 rounded-lg border-2 font-medium ${getTypeColor(card.type)}`}>
                    {CARD_TYPE_LABELS[card.type as keyof typeof CARD_TYPE_LABELS] || card.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rareza</label>
                  <span className={`inline-block px-4 py-2 rounded-lg font-medium ${getRarityColor(card.rarity)}`}>
                    {RARITY_TYPE_LABELS[card.rarity as keyof typeof RARITY_TYPE_LABELS] || card.rarity}
                  </span>
                </div>

                {card.cost !== null && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Coste</label>
                    <div className="text-3xl font-bold text-blue-600">{card.cost}</div>
                  </div>
                )}

                {card.attack !== null && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fuerza</label>
                    <div className="text-3xl font-bold text-red-600">{card.attack}</div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expansión</label>
                  <p className="text-gray-900 font-medium">{card.expansion}</p>
                </div>
              </div>

              {card.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Habilidad</label>
                  <p className="text-gray-900 leading-relaxed">{card.description}</p>
                </div>
              )}
            </div>

            {/* Otras versiones */}
            {cards.length > 1 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Versiones e Ilustraciones ({cards.length})
                </h2>
                <p className="text-gray-600 mb-6">
                  Esta carta tiene {cards.length} versiones diferentes. Haz clic en una para verla en detalle.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cards.map((version, index) => {
                    const rarityColor = getRarityColor(version.rarity)
                    return (
                      <button
                        key={version.id}
                        onClick={() => setSelectedCard(version)}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all text-left ${
                          selectedCard?.id === version.id
                            ? 'border-blue-500 ring-4 ring-blue-200 shadow-lg'
                            : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex gap-3 p-3">
                          {/* Miniatura */}
                          <div className="w-20 flex-shrink-0">
                            <div className="aspect-[2/3] bg-gray-100 rounded overflow-hidden">
                              {version.image_url ? (
                                <img
                                  src={version.image_url}
                                  alt={`${version.name} - ${version.expansion}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs text-gray-500">Sin imagen</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-sm text-gray-900 line-clamp-2">
                                Versión {index + 1}
                              </h3>
                              {selectedCard?.id === version.id && (
                                <div className="flex-shrink-0 bg-blue-500 text-white rounded-full p-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {version.expansion}
                            </p>

                            <div className="flex flex-wrap gap-1">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${rarityColor}`}>
                                {RARITY_TYPE_LABELS[version.rarity as keyof typeof RARITY_TYPE_LABELS]}
                              </span>
                              {version.cost !== null && (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
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
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <p className="text-blue-800 text-sm">
                  ℹ️ Esta carta solo tiene una versión disponible en la base de datos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

