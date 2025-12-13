import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import type { DeckCardEntry } from '@/types'

// Forzar que esta ruta sea dinámica para evitar ejecución durante el build
export const dynamic = 'force-dynamic'

// GET /api/decks - Obtener todas las barajas del usuario autenticado
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    
    // Obtener decks del usuario con JSONB - 1 query simple!
    const { data: decks, error: decksError } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (decksError) {
      throw decksError
    }

    // Expandir las cartas del JSONB con los datos completos
    const decksWithCards = await Promise.all(
      decks.map(async (deck) => {
        // Extraer los IDs de las cartas del JSONB
        const cardIds = deck.cards.map((c: DeckCardEntry) => c.card_id)
        const sideboardIds = deck.sideboard.map((c: DeckCardEntry) => c.card_id)
        const allCardIds = [...cardIds, ...sideboardIds]

        if (allCardIds.length === 0) {
          return {
            ...deck,
            cards: [],
            sideboard: []
          }
        }

        // Obtener datos completos de todas las cartas en 1 query
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .in('id', allCardIds)

        if (cardsError) {
          console.error('Error fetching cards:', cardsError)
          return {
            ...deck,
            cards: [],
            sideboard: []
          }
        }

        // Crear un mapa de cartas por ID para búsqueda rápida
        const cardsMap = new Map(cardsData.map(card => [card.id, card]))

        // Combinar datos del JSONB con los datos completos de las cartas
        const expandedCards = deck.cards.map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card) // Filtrar cartas no encontradas

        const expandedSideboard = deck.sideboard.map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        return {
          ...deck,
          cards: expandedCards,
          sideboard: expandedSideboard
        }
      })
    )

    return NextResponse.json(decksWithCards)
  } catch (error: any) {
    console.error('Error fetching decks:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al obtener las barajas' },
      { status: 500 }
    )
  }
}

// POST /api/decks - Crear una nueva baraja
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    
    const body = await request.json()
    const { name, description, cards, sideboard, race, is_public } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre de la baraja es requerido' },
        { status: 400 }
      )
    }

    if (!race) {
      return NextResponse.json(
        { error: 'La raza del mazo es requerida' },
        { status: 400 }
      )
    }

    // Preparar arrays JSONB de cartas
    const cardsArray: DeckCardEntry[] = (cards || []).map((card: any) => ({
      card_id: card.id,
      quantity: card.quantity || 1
    }))

    const sideboardArray: DeckCardEntry[] = (sideboard || []).map((card: any) => ({
      card_id: card.id,
      quantity: card.quantity || 1
    }))

    // Fecha actual para created_at y updated_at
    const now = new Date().toISOString()

    // Crear el deck con JSONB - 1 query simple!
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        name,
        description,
        user_id: user.id,
        race,
        format: 'Imperio Racial',
        is_public: is_public || false,
        cards: cardsArray,
        sideboard: sideboardArray,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (deckError) {
      throw deckError
    }

    // Obtener datos completos de las cartas para la respuesta
    const allCardIds = [
      ...cardsArray.map(c => c.card_id),
      ...sideboardArray.map(c => c.card_id)
    ]

    if (allCardIds.length > 0) {
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('id', allCardIds)

      if (cardsError) {
        console.error('Error fetching cards:', cardsError)
      } else {
        // Crear mapa de cartas
        const cardsMap = new Map(cardsData.map(card => [card.id, card]))

        // Expandir con datos completos
        const expandedCards = deck.cards.map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        const expandedSideboard = deck.sideboard.map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        return NextResponse.json({
          ...deck,
          cards: expandedCards,
          sideboard: expandedSideboard
        }, { status: 201 })
      }
    }

    // Si no hay cartas o hubo error, devolver deck básico
    return NextResponse.json({
      ...deck,
      cards: [],
      sideboard: []
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating deck:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al crear la baraja' },
      { status: 500 }
    )
  }
}
