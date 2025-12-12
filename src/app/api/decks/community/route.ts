import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { requireAuth } from '@/lib/auth'
import type { DeckCardEntry } from '@/types'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/decks/community - Obtener mazos públicos de la comunidad
export async function GET(request: NextRequest) {
  try {
    // Requerir autenticación para ver mazos de la comunidad
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'likes' // 'likes', 'recent', 'name'
    const race = searchParams.get('race') || ''
    
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('decks')
      .select(`
        *,
        deck_likes (
          id,
          user_id
        )
      `)
      .eq('is_public', true)

    // Filtrar por raza si se especifica
    if (race) {
      query = query.eq('race', race)
    }

    // Ordenar según el parámetro
    switch (sortBy) {
      case 'recent':
        query = query.order('created_at', { ascending: false })
        break
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'likes':
      default:
        // Ordenar por cantidad de likes (necesitamos contar los likes)
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data: decks, error: decksError } = await query
      .range(offset, offset + limit - 1)

    if (decksError) {
      throw decksError
    }

    // Obtener el total de mazos públicos para paginación
    let countQuery = supabase
      .from('decks')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)

    if (race) {
      countQuery = countQuery.eq('race', race)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Obtener información de usuarios para los mazos
    const userIds = Array.from(new Set((decks || []).map((d: any) => d.user_id)))
    const { data: usersData } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds)

    const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

    // Expandir las cartas del JSONB con los datos completos
    const decksWithCards = await Promise.all(
      (decks || []).map(async (deck: any) => {
        // Extraer los IDs de las cartas del JSONB
        const cardIds = (deck.cards || []).map((c: DeckCardEntry) => c.card_id)
        const sideboardIds = (deck.sideboard || []).map((c: DeckCardEntry) => c.card_id)
        const allCardIds = [...cardIds, ...sideboardIds]

        // Contar likes
        const likesCount = deck.deck_likes?.length || 0

        // Obtener información del usuario
        const user = usersMap.get(deck.user_id)

        if (allCardIds.length === 0) {
          return {
            ...deck,
            cards: [],
            sideboard: [],
            likes_count: likesCount,
            user: user ? { id: user.id, username: user.username } : null
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
            sideboard: [],
            likes_count: likesCount,
            user: deck.users
          }
        }

        // Crear un mapa de cartas por ID para búsqueda rápida
        const cardsMap = new Map(cardsData.map((card: any) => [card.id, card]))

        // Combinar datos del JSONB con los datos completos de las cartas
        const expandedCards = (deck.cards || []).map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        const expandedSideboard = (deck.sideboard || []).map((entry: DeckCardEntry) => ({
          ...entry,
          card: cardsMap.get(entry.card_id)
        })).filter((c: any) => c.card)

        return {
          ...deck,
          cards: expandedCards,
          sideboard: expandedSideboard,
          likes_count: likesCount,
          user: user ? { id: user.id, username: user.username } : null
        }
      })
    )

    // Ordenar por likes si es necesario (después de obtener los datos)
    if (sortBy === 'likes') {
      decksWithCards.sort((a: any, b: any) => (b.likes_count || 0) - (a.likes_count || 0))
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      decks: decksWithCards,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    console.error('Error fetching community decks:', error)
    return NextResponse.json(
      { error: 'Error al obtener los mazos de la comunidad' },
      { status: 500 }
    )
  }
}

