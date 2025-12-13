import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

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

    // Query para obtener el total de cartas
    let countQuery = supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })

    if (expansion) {
      countQuery = countQuery.eq('expansion', expansion)
    }
    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`)
    }
    if (type) {
      countQuery = countQuery.eq('type', type)
    }
    if (race) {
      countQuery = countQuery.eq('race', race)
    }
    if (rarity) {
      countQuery = countQuery.eq('rarity', rarity)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Query para obtener las cartas paginadas
    let dataQuery = supabase
      .from('cards')
      .select('*')
      .order('expansion', { ascending: true })
      .order('image_file', { ascending: true })
      .range(offset, offset + limit - 1)

    if (expansion) {
      dataQuery = dataQuery.eq('expansion', expansion)
    }
    if (search) {
      dataQuery = dataQuery.ilike('name', `%${search}%`)
    }
    if (type) {
      dataQuery = dataQuery.eq('type', type)
    }
    if (race) {
      dataQuery = dataQuery.eq('race', race)
    }
    if (rarity) {
      dataQuery = dataQuery.eq('rarity', rarity)
    }

    const { data: cards, error: dataError } = await dataQuery

    if (dataError) {
      throw dataError
    }

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
