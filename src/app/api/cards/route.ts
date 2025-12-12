import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { getRotatedExpansions } from '@/lib/rotation'

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
    const rotation = searchParams.get('rotation') // 'true' para filtrar por rotación

    // Obtener el orden de las expansiones
    const { data: expansions } = await supabase
      .from('expansions')
      .select('name, display_order')
      .order('display_order', { ascending: true })

    const expansionOrder = new Map<string, number>()
    expansions?.forEach(exp => {
      expansionOrder.set(exp.name, exp.display_order)
    })

    // Si se solicita filtro de rotación, obtener las expansiones en rotación
    let rotatedExpansions: string[] = []
    if (rotation === 'true') {
      rotatedExpansions = await getRotatedExpansions()
    }

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

      // Aplicar filtro de rotación si se solicita
      if (rotation === 'true' && rotatedExpansions.length > 0) {
        query = query.in('expansion', rotatedExpansions)
      }

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

    // Orden de rareza (de mayor a menor)
    const rarityOrder: Record<string, number> = {
      'PROMO': 1,
      'SECRETA': 2,
      'LEGENDARIA': 3,
      'ULTRA_REAL': 4,
      'MEGA_REAL': 5,
      'REAL': 6,
      'CORTESANO': 7,
      'VASALLO': 8
    }

    // Ordenar las cartas por expansión (INVERSO, del mayor al menor), edid y luego por rareza
    const sortedCards = cards?.sort((a, b) => {
      const orderA = expansionOrder.get(a.expansion) ?? 999
      const orderB = expansionOrder.get(b.expansion) ?? 999
      
      // Ordenar expansiones en orden INVERSO (mayor a menor)
      if (orderA !== orderB) {
        return orderB - orderA  // Invertido
      }
      
      // Si están en la misma expansión, ordenar por image_file (edid)
      const edidA = parseInt(a.image_file?.replace('.png', '') || '999999')
      const edidB = parseInt(b.image_file?.replace('.png', '') || '999999')
      
      if (edidA !== edidB) {
        return edidA - edidB
      }
      
      // Si tienen el mismo edid, ordenar por rareza
      const rarityA = rarityOrder[a.rarity] ?? 999
      const rarityB = rarityOrder[b.rarity] ?? 999
      
      return rarityA - rarityB
    })

    // Filtrar duplicados por nombre, manteniendo solo la primera versión (primera en el orden)
    const seenNames = new Set<string>()
    let filteredCards = sortedCards?.filter(card => {
      if (seenNames.has(card.name)) {
        return false
      }
      seenNames.add(card.name)
      return true
    })

    // Aplicar filtro de rotación adicional si se solicita (por si acaso alguna carta se filtró antes)
    if (rotation === 'true' && rotatedExpansions.length > 0) {
      filteredCards = filteredCards?.filter(card => 
        rotatedExpansions.includes(card.expansion)
      )
    }

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
