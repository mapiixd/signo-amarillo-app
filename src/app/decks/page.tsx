'use client'

import { useState, useEffect } from 'react'
import { DeckWithCards } from '@/types'
import { DeckList } from '@/components/DeckList'
import Footer from '@/components/Footer'

export default function DecksPage() {
  const [decks, setDecks] = useState<DeckWithCards[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDecks()
  }, [])

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks')
      if (response.ok) {
        const data = await response.json()
        setDecks(data)
      }
    } catch (error) {
      console.error('Error fetching decks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando barajas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Barajas</h1>
            <p className="text-gray-600 mt-2">
              Gestiona y organiza tus decks de Mitos y Leyendas
            </p>
          </div>
          <a
            href="/decks/format-select"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Nueva Baraja
          </a>
        </div>

        <DeckList decks={decks} />
      </div>

      <Footer />
    </div>
  )
}
