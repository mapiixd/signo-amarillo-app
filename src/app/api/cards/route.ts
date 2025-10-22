import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/cards - Obtener todas las cartas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const expansion = searchParams.get('expansion')
    const cost = searchParams.get('cost')
    const attack = searchParams.get('attack')
    const race = searchParams.get('race')
    const ability = searchParams.get('ability')

    // Obtener el orden de las expansiones
    const { data: expansions } = await supabase
      .from('expansions')
      .select('name, display_order')
      .order('display_order', { ascending: true })

    const expansionOrder = new Map<string, number>()
    expansions?.forEach(exp => {
      expansionOrder.set(exp.name, exp.display_order)
    })

    // Obtener TODAS las cartas (sin límite de 1000)
    let allCards: any[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('cards')
        .select('*')
        .eq('is_active', true)
        .range(from, from + batchSize - 1)

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      if (type) {
        query = query.eq('type', type)
      }

      if (expansion) {
        query = query.eq('expansion', expansion)
      }

      // Filtro de coste
      if (cost) {
        if (cost === '6+') {
          query = query.gte('cost', 6)
        } else {
          query = query.eq('cost', parseInt(cost))
        }
      }

      // Filtro de ataque/fuerza
      if (attack) {
        if (attack === '7+') {
          query = query.gte('attack', 7)
        } else {
          query = query.eq('attack', parseInt(attack))
        }
      }

      // Filtro de raza
      if (race) {
        query = query.eq('race', race)
      }

      // Filtro de habilidad (texto)
      if (ability) {
        query = query.ilike('description', `%${ability}%`)
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

    const cards = allCards

    // Ordenar las cartas por expansión (usando el orden de la tabla) y luego por image_file (edid)
    const sortedCards = cards?.sort((a, b) => {
      const orderA = expansionOrder.get(a.expansion) ?? 999
      const orderB = expansionOrder.get(b.expansion) ?? 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // Si están en la misma expansión, ordenar por image_file (edid)
      const edidA = parseInt(a.image_file?.replace('.png', '') || '999')
      const edidB = parseInt(b.image_file?.replace('.png', '') || '999')
      return edidA - edidB
    })

    // Filtrar duplicados por nombre, manteniendo solo la primera versión (primera en el orden)
    const seenNames = new Set<string>()
    const filteredCards = sortedCards?.filter(card => {
      if (seenNames.has(card.name)) {
        return false
      }
      seenNames.add(card.name)
      return true
    })

    return NextResponse.json(filteredCards)
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cartas' },
      { status: 500 }
    )
  }
}

// POST /api/cards - Crear una nueva carta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, cost, attack, defense, description, imageUrl, rarity, expansion } = body

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
        cost: cost !== undefined ? parseInt(cost) : null,
        attack: attack !== undefined ? parseInt(attack) : null,
        defense: defense !== undefined ? parseInt(defense) : null,
        description,
        image_url: imageUrl,
        rarity,
        expansion,
        is_active: false
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
