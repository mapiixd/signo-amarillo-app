'use client'

import { DeckWithCards } from '@/types'
import Link from 'next/link'

interface DeckListProps {
  decks: DeckWithCards[]
}

export function DeckList({ decks }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <div className="text-center py-16 bg-[#0F1419] border border-[#2D9B96] rounded-xl">
        <div className="text-6xl mb-4">🎴</div>
        <p className="text-[#A0A0A0] text-lg mb-6">No tienes barajas creadas aún</p>
        <p className="text-[#4ECDC4] text-sm mb-6 max-w-md mx-auto">
          Comienza tu viaje en Carcosa. Forja tu primer mazo y descubre el poder del formato Imperio.
        </p>
        <Link
          href="/decks/format-select"
          className="inline-block px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium"
        >
          Crear primera baraja
        </Link>
      </div>
    )
  }

  // Calcular total de cartas (sumando quantities)
  const getTotalCards = (deck: DeckWithCards) => {
    return deck.cards.reduce((sum, entry) => sum + entry.quantity, 0)
  }

  const getTotalSideboard = (deck: DeckWithCards) => {
    return deck.sideboard.reduce((sum, entry) => sum + entry.quantity, 0)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => (
        <div 
          key={deck.id} 
          className="bg-[#0F1419] border border-[#2D9B96] rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:border-[#4ECDC4] transition-all group"
        >
          {/* Header con raza */}
          <div className="relative bg-[#1A2332] p-4 overflow-hidden min-h-[100px]">
            {/* Imagen de fondo grande - ocupa todo el header */}
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
              <h3 className="text-xl font-bold text-[#F4C430] mb-1 drop-shadow-lg">{deck.name}</h3>
              <div className="flex items-center gap-2">
                {deck.race && (
                  <span className="text-xs bg-[#0A0E1A] text-[#F4C430] px-2 py-1 rounded-full font-medium border border-[#2D9B96]">
                    {deck.race}
                  </span>
                )}
                <span className="text-xs text-[#4ECDC4] font-medium">
                  {deck.format || 'Imperio Racial'}
                </span>
              </div>
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
                  {getTotalCards(deck)}
                </div>
                <div className="text-xs text-[#4ECDC4] mt-1">Mazo Principal</div>
              </div>
              <div className="bg-[#121825] border border-[#2D9B96]/30 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#F4C430]">
                  {getTotalSideboard(deck)}
                </div>
                <div className="text-xs text-[#4ECDC4] mt-1">Sidedeck</div>
              </div>
            </div>

            {/* Footer info */}
            <div className="text-xs text-[#A0A0A0] mb-4 flex items-center justify-between">
              <span>Creada: {new Date(deck.created_at).toLocaleDateString('es-ES')}</span>
              {deck.is_public && (
                <span className="text-[#4ECDC4]">🌐 Pública</span>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Link
                href={`/decks/${deck.id}`}
                className="flex-1 px-4 py-2.5 bg-[#2D9B96] text-white text-center rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium text-sm"
              >
                Ver Baraja
              </Link>
              <Link
                href={`/decks/${deck.id}/edit`}
                className="px-4 py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] text-center rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium text-sm"
              >
                Editar
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
