import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { type FormatType, type BanlistEntry } from '@/lib/banlist'

// Función auxiliar para obtener banlists desde la base de datos
async function getBanlistsFromDB(): Promise<Record<FormatType, BanlistEntry[]>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('banlist_entries')
    .select('*')
    .order('card_name', { ascending: true })

  if (error) {
    console.error('Error fetching banlists from DB:', error)
    return {
      'Imperio Racial': [],
      'VCR': [],
      'Triadas': []
    }
  }

  const banlists: Record<FormatType, BanlistEntry[]> = {
    'Imperio Racial': [],
    'VCR': [],
    'Triadas': []
  }

  if (data) {
    data.forEach(entry => {
      const format = entry.format as FormatType
      if (banlists[format]) {
        banlists[format].push({
          cardName: entry.card_name,
          status: entry.status as BanlistEntry['status'],
          maxCopies: entry.max_copies
        })
      }
    })
  }

  return banlists
}

// GET /api/cards/banlist - Obtener todas las cartas de la banlist
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    // Obtener todas las banlists desde la base de datos
    const banlists = await getBanlistsFromDB()
    
    // Obtener todos los nombres de cartas de todas las banlists
    const allCardNames = new Set<string>()
    const formats: FormatType[] = ['Imperio Racial', 'VCR', 'Triadas']
    
    formats.forEach(format => {
      banlists[format].forEach(entry => {
        allCardNames.add(entry.cardName)
      })
    })

    const cardNamesArray = Array.from(allCardNames)

    if (cardNamesArray.length === 0) {
      return NextResponse.json({ cards: [] })
    }

    // Buscar cartas en lotes para evitar queries muy largas
    const cards: any[] = []
    const batchSize = 10 // Buscar 10 cartas a la vez
    
    for (let i = 0; i < cardNamesArray.length; i += batchSize) {
      const batch = cardNamesArray.slice(i, i + batchSize)
      const orConditions = batch.map(name => `name.ilike.%${name}%`).join(',')
      
      const { data: batchCards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('is_active', true)
        .or(orConditions)
      
      if (error) {
        console.error('Error fetching batch:', error)
        continue
      }
      
      if (batchCards) {
        cards.push(...batchCards)
      }
    }

    // Orden de rareza de menor a mayor (menor rareza = versión base)
    const rarityOrder: Record<string, number> = {
      'VASALLO': 1,
      'CORTESANO': 2,
      'REAL': 3,
      'MEGA_REAL': 4,
      'ULTRA_REAL': 5,
      'LEGENDARIA': 7,
      'PROMO': 6,
      'SECRETA': 8
    }

    // Crear un mapa de cartas por nombre (normalizado), seleccionando la versión con menor rareza
    const cardsMap = new Map<string, any>()
    
    if (cards) {
      cards.forEach(card => {
        const normalizedName = card.name.toLowerCase().trim()
        const existingCard = cardsMap.get(normalizedName)
        
        if (!existingCard) {
          // Si no existe, agregar esta carta
          cardsMap.set(normalizedName, card)
        } else {
          // Si ya existe, comparar rarezas y mantener la de menor rareza
          const existingRarityOrder = rarityOrder[existingCard.rarity] || 999
          const currentRarityOrder = rarityOrder[card.rarity] || 999
          
          if (currentRarityOrder < existingRarityOrder) {
            // Esta carta tiene menor rareza, reemplazar
            cardsMap.set(normalizedName, card)
          }
        }
      })
    }

    // Crear un mapa final que mapea nombres de banlist a cartas encontradas
    const result: Record<string, any> = {}
    
    formats.forEach(format => {
      banlists[format].forEach(entry => {
        const banlistName = entry.cardName.toLowerCase().trim()
        
        // Buscar coincidencia exacta primero
        let foundCard = cardsMap.get(banlistName)
        
        // Si no hay coincidencia exacta, buscar parcial
        if (!foundCard) {
          for (const [normalizedName, card] of cardsMap.entries()) {
            if (normalizedName.includes(banlistName) || banlistName.includes(normalizedName)) {
              foundCard = card
              break
            }
          }
        }
        
        // Si aún no encontramos, buscar en todas las cartas
        if (!foundCard && cards) {
          foundCard = cards.find((c: any) => 
            c.name.toLowerCase().trim() === banlistName ||
            c.name.toLowerCase().includes(banlistName) ||
            banlistName.includes(c.name.toLowerCase().trim())
          )
        }
        
        if (foundCard && !result[entry.cardName]) {
          result[entry.cardName] = foundCard
        }
      })
    })

    return NextResponse.json({ cards: Object.values(result) })
  } catch (error: any) {
    console.error('Error fetching banlist cards:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cartas de la banlist' },
      { status: 500 }
    )
  }
}

