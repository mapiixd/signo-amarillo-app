import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { requireAuth } from '@/lib/auth'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/decks - Obtener todas las barajas del usuario autenticado
export async function GET() {
  try {
    const user = await requireAuth()
    
    // Obtener solo los decks del usuario autenticado
    const { data: decks, error: decksError } = await supabase
      .from('decks')
      .select('*')
      .eq('userId', user.id)
      .order('updated_at', { ascending: false })

    if (decksError) {
      throw decksError
    }

    // Para cada deck, obtener las cartas relacionadas
    const decksWithCards = await Promise.all(
      decks.map(async (deck) => {
        const { data: deckCards, error: cardsError } = await supabase
          .from('deck_cards')
          .select(`
            id,
            quantity,
            card:card_id (
              id,
              name,
              type,
              cost,
              attack,
              defense,
              description,
              image_url,
              image_file,
              rarity,
              expansion,
              is_active
            )
          `)
          .eq('deck_id', deck.id)

        if (cardsError) {
          console.error('Error fetching deck cards:', cardsError)
          return { ...deck, deckCards: [] }
        }

        return {
          ...deck,
          deckCards: deckCards || []
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
    const user = await requireAuth()
    
    const body = await request.json()
    const { name, description, cards, is_public } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre de la baraja es requerido' },
        { status: 400 }
      )
    }

    // Crear el deck asociado al usuario autenticado
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        name,
        description,
        userId: user.id,
        is_public: is_public || false
      })
      .select()
      .single()

    if (deckError) {
      throw deckError
    }

    // Si hay cartas, crear las relaciones
    if (cards && cards.length > 0) {
      const deckCardsData = cards.map((card: { id: string; quantity: number }) => ({
        deck_id: deck.id,
        card_id: card.id,
        quantity: card.quantity || 1
      }))

      const { error: cardsError } = await supabase
        .from('deck_cards')
        .insert(deckCardsData)

      if (cardsError) {
        throw cardsError
      }
    }

    // Obtener el deck completo con las cartas
    const { data: deckCards, error: fetchError } = await supabase
      .from('deck_cards')
      .select(`
        id,
        quantity,
        card:card_id (
          id,
          name,
          type,
          cost,
          attack,
          defense,
          description,
          image_url,
          image_file,
          rarity,
          expansion,
          is_active
        )
      `)
      .eq('deck_id', deck.id)

    if (fetchError) {
      throw fetchError
    }

    const deckWithCards = {
      ...deck,
      deckCards: deckCards || []
    }

    return NextResponse.json(deckWithCards, { status: 201 })
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
