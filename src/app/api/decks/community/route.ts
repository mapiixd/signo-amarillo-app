import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { getCurrentSession } from '@/lib/auth'
import type { DeckCardEntry } from '@/types'

// Forzar que esta ruta sea dinámica para evitar ejecución durante el build
export const dynamic = 'force-dynamic'

// GET /api/decks/community - Obtener mazos públicos de la comunidad
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    // Autenticación opcional - si el usuario está autenticado, incluiremos información de likes
    const session = await getCurrentSession()
    const currentUserId = session?.user?.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'recent' // 'likes', 'recent', 'name'
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

    // Obtener likes del usuario actual si está autenticado
    let userLikesSet = new Set<string>()
    if (currentUserId) {
      const deckIds = (decks || []).map((d: any) => d.id)
      if (deckIds.length > 0) {
        const { data: userLikes } = await supabase
          .from('deck_likes')
          .select('deck_id')
          .eq('user_id', currentUserId)
          .in('deck_id', deckIds)
        
        if (userLikes) {
          userLikesSet = new Set(userLikes.map((like: any) => like.deck_id))
        }
      }
    }

    // Para el listado, no necesitamos los datos completos de las cartas
    // Solo mantenemos los IDs y cantidades para calcular totales
    // Los datos completos se cargarán cuando el usuario vea el mazo individual
    const decksWithCards = (decks || []).map((deck: any) => {
      // Contar likes
      const likesCount = deck.deck_likes?.length || 0

      // Verificar si el usuario actual dio like (solo si está autenticado)
      const is_liked = currentUserId ? userLikesSet.has(deck.id) : undefined

      // Obtener información del usuario
      const user = usersMap.get(deck.user_id)

      // Mantener solo la estructura básica de cards y sideboard (IDs y cantidades)
      // No expandimos los datos completos de las cartas para optimizar la respuesta
      return {
        ...deck,
        // Mantener cards y sideboard como están (solo IDs y cantidades)
        // El frontend solo necesita las cantidades para mostrar totales
        cards: deck.cards || [],
        sideboard: deck.sideboard || [],
        likes_count: likesCount,
        is_liked: is_liked,
        user: user ? { id: user.id, username: user.username } : null
      }
    })

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

