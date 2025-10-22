'use client'

import { DeckWithCards } from '@/types'
import Link from 'next/link'

interface DeckListProps {
  decks: DeckWithCards[]
}

export function DeckList({ decks }: DeckListProps) {
  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No tienes barajas creadas aún</p>
        <Link
          href="/decks/new"
          className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear primera baraja
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {decks.map((deck) => (
        <div key={deck.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{deck.name}</h3>

          {deck.description && (
            <p className="text-gray-600 mb-4">{deck.description}</p>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              {deck.deckCards.length} cartas
            </span>
            <span className="text-sm text-gray-500">
              Creada: {new Date(deck.createdAt).toLocaleDateString('es-ES')}
            </span>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/decks/${deck.id}`}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition-colors"
            >
              Ver baraja
            </Link>
            <Link
              href={`/decks/${deck.id}/edit`}
              className="px-4 py-2 bg-gray-600 text-white text-center rounded hover:bg-gray-700 transition-colors"
            >
              Editar
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
