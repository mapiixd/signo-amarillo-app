import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { type FormatType, type BanlistEntry } from '@/lib/banlist'
import { filterCardsInRotation } from '@/lib/rotation'
import { isDeckBuilderCardAvailable } from '@/lib/deck-builder-card-availability'
import type { Card } from '@/types'

type DbBanlistEntry = {
  card_name: string
  format: string
  status: BanlistEntry['status']
  max_copies: number | null
}

const FORMATS: FormatType[] = ['Imperio Racial', 'VCR', 'Triadas']
const normalizeCardName = (name: string) => name.trim().toLowerCase()

async function fetchAllActiveCards(): Promise<Card[]> {
  const supabase = getSupabaseClient()
  const batchSize = 1000
  let from = 0
  let allCards: Card[] = []

  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('is_active', true)
      .range(from, from + batchSize - 1)

    if (error) {
      throw error
    }

    if (data?.length) {
      allCards = allCards.concat(data as Card[])
      from += batchSize
    }

    if (!data || data.length < batchSize) {
      break
    }
  }

  return allCards
}

// Funcion auxiliar para obtener banlists desde la base de datos
async function getBanlistsFromDB(): Promise<Record<FormatType, BanlistEntry[]>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('banlist_entries')
    .select('*')
    .order('card_name', { ascending: true })

  if (error) {
    console.error('Error fetching banlists from DB:', error)
    return {
      'Imperio Racial': [],
      'VCR': [],
      'Triadas': []
    }
  }

  const banlists: Record<FormatType, BanlistEntry[]> = {
    'Imperio Racial': [],
    'VCR': [],
    'Triadas': []
  }

  if (data) {
    const entries = data as DbBanlistEntry[]

    entries.forEach((entry) => {
      const format = entry.format as FormatType
      if (banlists[format]) {
        banlists[format].push({
          cardName: entry.card_name,
          status: entry.status,
          maxCopies: entry.max_copies ?? (entry.status === 'banned' ? 0 : entry.status === 'limited-1' ? 1 : 2)
        })
      }
    })
  }

  return banlists
}

// GET /api/cards/banlist - Obtener todas las cartas de la banlist
export async function GET() {
  try {
    const banlists = await getBanlistsFromDB()

    const allCardNames = new Set<string>()

    FORMATS.forEach((format) => {
      banlists[format].forEach((entry) => {
        allCardNames.add(normalizeCardName(entry.cardName))
      })
    })

    if (allCardNames.size === 0) {
      return NextResponse.json({ cards: [] })
    }

    const candidateCards = (await fetchAllActiveCards()).filter((card) =>
      allCardNames.has(normalizeCardName(card.name))
    )
    const availableCards = (await filterCardsInRotation(candidateCards, 'Imperio Racial'))
      .filter(isDeckBuilderCardAvailable)

    // Orden de rareza de menor a mayor (menor rareza = version base)
    const rarityOrder: Record<string, number> = {
      'VASALLO': 1,
      'CORTESANO': 2,
      'REAL': 3,
      'MEGA_REAL': 4,
      'ULTRA_REAL': 5,
      'PROMO': 6,
      'LEGENDARIA': 7,
      'SECRETA': 8
    }

    const cardsMap = new Map<string, Card>()

    availableCards.forEach((card) => {
      const normalizedName = normalizeCardName(card.name)
      const existingCard = cardsMap.get(normalizedName)

      if (!existingCard) {
        cardsMap.set(normalizedName, card)
        return
      }

      const existingRarityOrder = rarityOrder[existingCard.rarity] || 999
      const currentRarityOrder = rarityOrder[card.rarity] || 999

      if (currentRarityOrder < existingRarityOrder) {
        cardsMap.set(normalizedName, card)
      }
    })

    const result: Record<string, Card> = {}

    FORMATS.forEach((format) => {
      banlists[format].forEach((entry) => {
        const foundCard = cardsMap.get(normalizeCardName(entry.cardName))

        if (foundCard && !result[entry.cardName]) {
          result[entry.cardName] = foundCard
        }
      })
    })

    return NextResponse.json({ cards: Object.values(result) })
  } catch (error) {
    console.error('Error fetching banlist cards:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cartas de la banlist' },
      { status: 500 }
    )
  }
}
