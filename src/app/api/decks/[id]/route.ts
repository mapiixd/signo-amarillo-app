import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'
import type { DeckCardEntry } from '@/types'

// PUT /api/decks/[id] - Actualizar una baraja
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    const { id } = await params
    
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

    // Verificar que la baraja pertenece al usuario
    const { data: existingDeck, error: deckError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', id)
      .single()

    if (deckError) {
      throw deckError
    }

    if (!existingDeck) {
      return NextResponse.json(
        { error: 'Baraja no encontrada' },
        { status: 404 }
      )
    }

    if (existingDeck.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta baraja' },
        { status: 403 }
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

    // Fecha actual para updated_at
    const now = new Date().toISOString()

    // Actualizar el deck con JSONB
    const { data: deck, error: updateError } = await supabase
      .from('decks')
      .update({
        name,
        description,
        race,
        is_public: is_public || false,
        cards: cardsArray,
        sideboard: sideboardArray,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
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
        })
      }
    }

    // Si no hay cartas o hubo error, devolver deck básico
    return NextResponse.json({
      ...deck,
      cards: [],
      sideboard: []
    })

  } catch (error: any) {
    console.error('Error updating deck:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar la baraja' },
      { status: 500 }
    )
  }
}

// DELETE /api/decks/[id] - Eliminar una baraja
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    const { id } = await params

    // Verificar que la baraja pertenece al usuario
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', id)
      .single()

    if (deckError) {
      throw deckError
    }

    if (!deck) {
      return NextResponse.json(
        { error: 'Baraja no encontrada' },
        { status: 404 }
      )
    }

    if (deck.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta baraja' },
        { status: 403 }
      )
    }

    // Eliminar la baraja
    const { error: deleteError } = await supabase
      .from('decks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting deck:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar la baraja' },
      { status: 500 }
    )
  }
}
