import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/admin/cards - Obtener cartas para administración con paginación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const expansion = searchParams.get('expansion')
    const search = searchParams.get('search')
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
        is_active: isActive || false
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
