import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import type { DeckCardEntry } from '@/types'

// POST /api/decks/[id]/copy - Copiar un mazo público a los mazos del usuario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    const { id } = await params

    // Obtener el mazo original
    const { data: originalDeck, error: deckError } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .single()

    if (deckError || !originalDeck) {
      return NextResponse.json(
        { error: 'Mazo no encontrado' },
        { status: 404 }
      )
    }

    if (!originalDeck.is_public) {
      return NextResponse.json(
        { error: 'Este mazo no es público' },
        { status: 403 }
      )
    }

    // Verificar que el usuario no sea el dueño del mazo original
    if (originalDeck.user_id === user.id) {
      return NextResponse.json(
        { error: 'No puedes copiar tu propio mazo' },
        { status: 400 }
      )
    }

    // Crear una copia del mazo con nombre modificado
    const copiedName = `${originalDeck.name} (Copia)`
    
    // Fecha actual para created_at y updated_at
    const now = new Date().toISOString()
    
    const { data: copiedDeck, error: copyError } = await supabase
      .from('decks')
      .insert({
        name: copiedName,
        description: originalDeck.description,
        user_id: user.id,
        race: originalDeck.race,
        format: originalDeck.format,
        is_public: false, // La copia es privada por defecto
        cards: originalDeck.cards || [],
        sideboard: originalDeck.sideboard || [],
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (copyError) {
      throw copyError
    }

    // Obtener datos completos de las cartas para la respuesta
    const allCardIds = [
      ...(originalDeck.cards || []).map((c: DeckCardEntry) => c.card_id),
      ...(originalDeck.sideboard || []).map((c: DeckCardEntry) => c.card_id)
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
        const cardsMap = new Map(cardsData.map((card: any) => [card.id, card]))

        // Expandir con datos completos
        const expandedCards = (copiedDeck.cards || []).map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        const expandedSideboard = (copiedDeck.sideboard || []).map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        return NextResponse.json({
          ...copiedDeck,
          cards: expandedCards,
          sideboard: expandedSideboard
        }, { status: 201 })
      }
    }

    // Si no hay cartas o hubo error, devolver deck básico
    return NextResponse.json({
      ...copiedDeck,
      cards: [],
      sideboard: []
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error copying deck:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al copiar el mazo' },
      { status: 500 }
    )
  }
}

