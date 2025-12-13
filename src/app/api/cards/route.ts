import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { filterCardsInRotation } from '@/lib/rotation'

// Forzar que esta ruta sea dinámica para evitar ejecución durante el build
export const dynamic = 'force-dynamic'

// GET /api/cards - Obtener todas las cartas
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
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

      // Nota: No filtramos por expansión aquí cuando rotation=true porque
      // algunas cartas pueden estar en rotación individual aunque su expansión no lo esté

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

    // Orden de rareza (de mayor a menor rareza)
    // Números más altos = rareza base (menos rara)
    // Orden: Promo > Secreta > Legendaria > Ultra Real > Mega Real > Real > Cortesano > Vasallo
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
    
    // Rarezas especiales que deben ser filtradas (solo mostrar rareza base)
    const specialRarities = ['PROMO', 'SECRETA', 'LEGENDARIA']

    // Función para extraer edid de image_url o image_file
    const extractEdid = (card: any): number => {
      // Prioridad 1: Intentar extraer de image_url
      if (card.image_url) {
        // Extraer el nombre del archivo de la URL (puede ser CDN o ruta local)
        // Ejemplos: /cards/libertadores/003.png, https://cdn.com/cards/libertadores/012.webp
        const urlMatch = card.image_url.match(/\/(\d+)\.(png|webp|jpg|jpeg)/i)
        if (urlMatch && urlMatch[1]) {
          const edid = parseInt(urlMatch[1], 10)
          if (!isNaN(edid)) {
            return edid
          }
        }
      }
      
      // Prioridad 2: Intentar extraer de image_file como fallback
      if (card.image_file) {
        const fileMatch = card.image_file.match(/(\d+)\.(png|webp|jpg|jpeg)/i)
        if (fileMatch && fileMatch[1]) {
          const edid = parseInt(fileMatch[1], 10)
          if (!isNaN(edid)) {
            return edid
          }
        }
        // Fallback: intentar parsear directamente (formato antiguo)
        const edid = parseInt(card.image_file.replace(/\.(png|webp|jpg|jpeg)/i, ''), 10)
        if (!isNaN(edid)) {
          return edid
        }
      }
      
      // Si no se puede extraer, retornar un valor alto para que vaya al final
      return 999999
    }

    // Ordenar las cartas por expansión, rareza (en orden específico) y luego por edid
    const sortedCards = cards?.sort((a, b) => {
      const orderA = expansionOrder.get(a.expansion) ?? 999
      const orderB = expansionOrder.get(b.expansion) ?? 999
      
      // Ordenar expansiones en orden INVERSO (mayor a menor)
      if (orderA !== orderB) {
        return orderB - orderA  // Invertido
      }
      
      // Si están en la misma expansión, ordenar por rareza primero (Promo > Secreta > Legendaria > Ultra Real > Mega Real > Real > Cortesano > Vasallo)
      const rarityA = rarityOrder[a.rarity] ?? 999
      const rarityB = rarityOrder[b.rarity] ?? 999
      
      if (rarityA !== rarityB) {
        return rarityA - rarityB  // Menor número = mayor rareza, aparece primero
      }
      
      // Si tienen la misma rareza y están en Libertadores, priorizar las que tienen "25_aniversario" en image_url
      // Excluir el "caleuche" de esta excepción
      if (a.expansion === 'Libertadores' && b.expansion === 'Libertadores') {
        const nameA = (a.name?.toLowerCase() ?? '').trim()
        const nameB = (b.name?.toLowerCase() ?? '').trim()
        const isCaleucheA = nameA.includes('caleuche')
        const isCaleucheB = nameB.includes('caleuche')
        
        const hasAniversarioA = a.image_url?.includes('25_aniversario') && !isCaleucheA ? 0 : 1
        const hasAniversarioB = b.image_url?.includes('25_aniversario') && !isCaleucheB ? 0 : 1
        
        if (hasAniversarioA !== hasAniversarioB) {
          return hasAniversarioA - hasAniversarioB  // Las que tienen 25_aniversario van primero (0 < 1)
        }
      }
      
      // Si tienen la misma rareza, ordenar por edid extraído de image_url o image_file
      const edidA = extractEdid(a)
      const edidB = extractEdid(b)
      
      return edidA - edidB
    })

    // Filtrar duplicados
    // En el editor de mazos (rotation=true): agrupar solo por nombre para evitar múltiples versiones
    // En el visor de cartas: agrupar por nombre+expansión para mostrar todas las versiones
    const cardsByKey = new Map<string, any>()
    
    // Determinar la clave de agrupación según el contexto
    const groupByExpansion = rotation !== 'true' // En el visor de cartas, agrupar por nombre+expansión
    
    sortedCards?.forEach(card => {
      // Normalizar el nombre para la comparación (case-insensitive, sin espacios extra)
      const normalizedName = card.name.trim().toLowerCase()
      const key = groupByExpansion 
        ? `${normalizedName}|${card.expansion}` 
        : normalizedName // Solo por nombre en el editor de mazos
      
      const currentRarityOrder = rarityOrder[card.rarity] ?? 999
      
      if (!cardsByKey.has(key)) {
        // Primera vez que vemos esta carta
        cardsByKey.set(key, card)
      } else {
        // Ya existe una versión de esta carta
        const existingCard = cardsByKey.get(key)!
        const existingRarityOrder = rarityOrder[existingCard.rarity] ?? 999
        
        // Mantener la carta con mayor rarezaOrder (menor rareza = rareza base)
        // Si la nueva carta tiene mayor rarezaOrder, reemplazar
        if (currentRarityOrder > existingRarityOrder) {
          cardsByKey.set(key, card)
        }
        // Si tienen el mismo rarezaOrder pero la existente es una rareza especial, reemplazar
        else if (currentRarityOrder === existingRarityOrder) {
          const existingIsSpecial = specialRarities.includes(existingCard.rarity)
          const currentIsSpecial = specialRarities.includes(card.rarity)
          
          // Si la existente es especial y la nueva no, reemplazar
          if (existingIsSpecial && !currentIsSpecial) {
            cardsByKey.set(key, card)
          }
          // Si ambas son especiales o ambas no, mantener la existente (ya está ordenada)
        }
      }
    })
    
    // Convertir el Map a array
    let filteredCards = Array.from(cardsByKey.values())

    // Reordenar las cartas filtradas para mantener el orden correcto
    filteredCards = filteredCards.sort((a, b) => {
      const orderA = expansionOrder.get(a.expansion) ?? 999
      const orderB = expansionOrder.get(b.expansion) ?? 999
      
      // Ordenar expansiones en orden INVERSO (mayor a menor)
      if (orderA !== orderB) {
        return orderB - orderA  // Invertido
      }
      
      // Si están en la misma expansión, ordenar por rareza primero (Promo > Secreta > Legendaria > Ultra Real > Mega Real > Real > Cortesano > Vasallo)
      const rarityA = rarityOrder[a.rarity] ?? 999
      const rarityB = rarityOrder[b.rarity] ?? 999
      
      if (rarityA !== rarityB) {
        return rarityA - rarityB  // Menor número = mayor rareza, aparece primero
      }
      
      // Si tienen la misma rareza y están en Libertadores, priorizar las que tienen "25_aniversario" en image_url
      // Excluir el "caleuche" de esta excepción
      if (a.expansion === 'Libertadores' && b.expansion === 'Libertadores') {
        const nameA = (a.name?.toLowerCase() ?? '').trim()
        const nameB = (b.name?.toLowerCase() ?? '').trim()
        const isCaleucheA = nameA.includes('caleuche')
        const isCaleucheB = nameB.includes('caleuche')
        
        const hasAniversarioA = a.image_url?.includes('25_aniversario') && !isCaleucheA ? 0 : 1
        const hasAniversarioB = b.image_url?.includes('25_aniversario') && !isCaleucheB ? 0 : 1
        
        if (hasAniversarioA !== hasAniversarioB) {
          return hasAniversarioA - hasAniversarioB  // Las que tienen 25_aniversario van primero (0 < 1)
        }
      }
      
      // Si tienen la misma rareza, ordenar por edid extraído de image_url o image_file
      const edidA = extractEdid(a)
      const edidB = extractEdid(b)
      
      return edidA - edidB
    })

    // Aplicar filtro de rotación si se solicita
    // Esto incluye tanto cartas por expansión como cartas individuales en rotación
    if (rotation === 'true') {
      // Obtener el formato del query string si está disponible, por defecto 'Imperio Racial'
      const format = searchParams.get('format') || 'Imperio Racial'
      filteredCards = await filterCardsInRotation(filteredCards || [], format)
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
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { name, type, cost, attack, defense, description, imageUrl, rarity, expansion } = body

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
        cost: cost !== undefined ? parseInt(cost) : null,
        attack: attack !== undefined ? parseInt(attack) : null,
        defense: defense !== undefined ? parseInt(defense) : null,
        description,
        image_url: imageUrl,
        rarity,
        expansion,
        is_active: false,
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
