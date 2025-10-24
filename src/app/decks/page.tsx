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
      <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
            <p className="text-[#4ECDC4]">Cargando barajas...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F4C430]">Mis Barajas</h1>
            <p className="text-[#A0A0A0] mt-2 text-sm sm:text-base">
              Gestiona y organiza tus decks de Mitos y Leyendas
            </p>
          </div>
          <a
            href="/decks/format-select"
            className="w-full sm:w-auto text-center px-5 py-2.5 sm:px-6 sm:py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium"
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
