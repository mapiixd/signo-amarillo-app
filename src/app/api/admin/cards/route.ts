import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { normalizeString } from '@/lib/utils'

// GET /api/admin/cards - Obtener cartas para administración con paginación
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const expansion = searchParams.get('expansion')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const race = searchParams.get('race')
    const rarity = searchParams.get('rarity')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    const offset = (page - 1) * limit

    // Obtener TODAS las cartas en lotes (sin límite de 1000)
    let allCards: any[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('cards')
        .select('*')
        .range(from, from + batchSize - 1)

      if (expansion) {
        query = query.eq('expansion', expansion)
      }
      // No aplicamos el filtro de búsqueda aquí porque necesitamos filtrar sin tildes después
      if (type) {
        query = query.eq('type', type)
      }
      if (race) {
        query = query.eq('race', race)
      }
      if (rarity) {
        query = query.eq('rarity', rarity)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        allCards = allCards.concat(data)
        from += batchSize
      }

      if (!data || data.length < batchSize) {
        hasMore = false
      }
    }

    // Aplicar filtro de búsqueda sin tildes si se solicita
    let filteredCards = allCards
    if (search) {
      const normalizedSearch = normalizeString(search)
      filteredCards = filteredCards.filter(card => 
        normalizeString(card.name).includes(normalizedSearch) ||
        (card.description && normalizeString(card.description).includes(normalizedSearch))
      )
    }

    // Calcular el total después del filtro de búsqueda
    const totalCount = filteredCards.length

    // Ordenar y paginar
    const sortedCards = filteredCards.sort((a, b) => {
      // Ordenar por expansión primero
      if (a.expansion !== b.expansion) {
        return a.expansion.localeCompare(b.expansion)
      }
      // Luego por image_file
      return (a.image_file || '').localeCompare(b.image_file || '')
    })

    // Aplicar paginación
    const cards = sortedCards.slice(offset, offset + limit)

    // Calcular información de paginación
    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      cards: cards || [],
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching admin cards:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cartas' },
      { status: 500 }
    )
  }
}

// POST /api/admin/cards - Crear una nueva carta
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const {
      name,
      type,
      cost,
      attack,
      defense,
      description,
      imageUrl,
      imageFile,
      rarity,
      expansion,
      race,
      isActive
    } = body

    if (!name || !type || !rarity || !expansion) {
      return NextResponse.json(
        { error: 'Nombre, tipo, rareza y expansión son requeridos' },
        { status: 400 }
      )
    }

    // Fecha actual para created_at y updated_at
    const now = new Date().toISOString()

    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        name,
        type,
        cost: cost !== undefined && cost !== '' ? parseInt(cost) : null,
        attack: attack !== undefined && attack !== '' ? parseInt(attack) : null,
        defense: defense !== undefined && defense !== '' ? parseInt(defense) : null,
        description,
        image_url: imageUrl,
        image_file: imageFile,
        rarity,
        expansion,
        race: race || null,
        is_active: isActive || false,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Error al crear la carta' },
      { status: 500 }
    )
  }
}
