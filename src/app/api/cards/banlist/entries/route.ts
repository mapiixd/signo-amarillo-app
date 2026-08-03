import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { type FormatType, type BanlistEntry } from '@/lib/banlist'
import { filterCardsInRotation } from '@/lib/rotation'
import { isDeckBuilderCardAvailable } from '@/lib/deck-builder-card-availability'

type PublicBanlistEntry = {
  card_name: string
  format: FormatType
  status: BanlistEntry['status']
  max_copies?: number | null
}

type RotationCard = {
  name: string
  expansion: string
}

type DbBanlistEntry = {
  card_name: string
  format: string
  status: BanlistEntry['status']
  max_copies: number | null
}

const normalizeCardName = (name: string) => name.trim().toLowerCase()

async function getDeckBuilderAvailableCardNames(cardNames: string[]): Promise<Set<string>> {
  if (cardNames.length === 0) {
    return new Set()
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cards')
    .select('name, expansion')
    .eq('is_active', true)

  if (error) {
    throw error
  }

  const requestedNames = new Set(cardNames.map(normalizeCardName))
  const candidateCards = ((data || []) as RotationCard[]).filter((card) =>
    requestedNames.has(normalizeCardName(card.name))
  )
  const cardsInRotation = await filterCardsInRotation(candidateCards, 'Imperio Racial')

  return new Set(
    cardsInRotation
      .filter(isDeckBuilderCardAvailable)
      .map((card) => normalizeCardName(card.name))
  )
}

// GET /api/cards/banlist/entries - Obtener todas las entradas de banlist (publica)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    let query = supabase
      .from('banlist_entries')
      .select('*')
      .order('card_name', { ascending: true })

    if (format) {
      query = query.eq('format', format)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching banlist entries:', error)
      return NextResponse.json(
        { error: 'Error al obtener las entradas de banlist' },
        { status: 500 }
      )
    }

    const entries: PublicBanlistEntry[] = ((data || []) as DbBanlistEntry[]).map((entry) => ({
      card_name: entry.card_name,
      format: entry.format as FormatType,
      status: entry.status,
      max_copies: entry.max_copies
    }))

    const availableCardNames = await getDeckBuilderAvailableCardNames(entries.map((entry) => entry.card_name))
    const filteredEntries = entries.filter((entry) => availableCardNames.has(normalizeCardName(entry.card_name)))

    return NextResponse.json({ entries: filteredEntries })
  } catch (error) {
    console.error('Error fetching banlist entries:', error)
    return NextResponse.json(
      { error: 'Error al obtener las entradas de banlist' },
      { status: 500 }
    )
  }
}
