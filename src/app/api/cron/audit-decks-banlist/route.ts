import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import type { DeckCardEntry } from '@/types'
import { auditAndPersistExpandedDeck } from '@/lib/deck-banlist-audit'

export const dynamic = 'force-dynamic'

type DeckForCron = {
  id: string
  format: string | null
  cards: DeckCardEntry[]
  sideboard: DeckCardEntry[]
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authorization = request.headers.get('authorization')
  return authorization === `Bearer ${secret}`
}

async function auditDeckBatch(limit: number, offset: number) {
  const supabase = getSupabaseClient()

  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id, format, cards, sideboard')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (decksError) {
    throw decksError
  }

  const typedDecks = (decks || []) as DeckForCron[]
  const cardIds = Array.from(new Set(
    typedDecks.flatMap((deck) => [
      ...(deck.cards || []).map((entry) => entry.card_id),
      ...(deck.sideboard || []).map((entry) => entry.card_id),
    ])
  ))

  const { data: cardsData, error: cardsError } = cardIds.length > 0
    ? await supabase.from('cards').select('*').in('id', cardIds)
    : { data: [], error: null }

  if (cardsError) {
    throw cardsError
  }

  const cardsMap = new Map((cardsData || []).map((card) => [card.id, card]))
  let invalidCount = 0

  for (const deck of typedDecks) {
    const expandedCards = (deck.cards || [])
      .map((entry) => ({ ...entry, card: cardsMap.get(entry.card_id) }))
      .filter((entry) => entry.card)

    const expandedSideboard = (deck.sideboard || [])
      .map((entry) => ({ ...entry, card: cardsMap.get(entry.card_id) }))
      .filter((entry) => entry.card)

    const audit = await auditAndPersistExpandedDeck(deck, expandedCards, expandedSideboard)
    if (audit.status === 'invalid') {
      invalidCount += 1
    }
  }

  return {
    checked: typedDecks.length,
    invalid: invalidCount,
    nextOffset: typedDecks.length === limit ? offset + limit : null,
  }
}

async function runAudit(request: NextRequest, options: { limit?: number; offset?: number; processAll?: boolean } = {}) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const limit = Math.min(Number(options.limit) || 100, 500)
    let offset = Number(options.offset) || 0
    let checked = 0
    let invalid = 0
    let nextOffset: number | null = offset

    do {
      const result = await auditDeckBatch(limit, offset)
      checked += result.checked
      invalid += result.invalid
      nextOffset = result.nextOffset
      offset = result.nextOffset || offset
    } while (options.processAll && nextOffset !== null)

    return NextResponse.json({
      checked,
      invalid,
      nextOffset,
    })
  } catch (error) {
    console.error('Error auditing deck banlists:', error)
    return NextResponse.json(
      { error: 'Error al auditar mazos contra la banlist' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return runAudit(request, { processAll: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return runAudit(request, {
    limit: body.limit,
    offset: body.offset,
  })
}
