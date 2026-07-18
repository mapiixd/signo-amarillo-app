import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { filterCardsInRotation } from '../src/lib/rotation'
import { DECK_BUILDER_EXCLUDED_EXPANSIONS, isDeckBuilderCardAvailable } from '../src/lib/deck-builder-card-availability'
import type { Card } from '../src/types'

const CARD_SELECT = [
  'id',
  'name',
  'type',
  'cost',
  'attack',
  'defense',
  'description',
  'image_url',
  'image_file',
  'rarity',
  'race',
  'expansion',
  'game',
  'is_active',
  'created_at',
  'updated_at'
].join(',')

const OUTPUT_PATH = 'data/cartas_disponibles_creador_mazos.xlsx'
const ROTATION_START_EXPANSION = 'Espiritu Samurai'

const rarityOrder: Record<string, number> = {
  PROMO: 1,
  SECRETA: 2,
  LEGENDARIA: 3,
  ULTRA_REAL: 4,
  MEGA_REAL: 5,
  REAL: 6,
  CORTESANO: 7,
  VASALLO: 8
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env')
  }

  return createClient(supabaseUrl, supabaseKey)
}

function extractEdid(card: Card): number {
  if (card.image_url) {
    const urlMatch = card.image_url.match(/\/(\d+)\.(png|webp|jpg|jpeg)/i)
    if (urlMatch?.[1]) {
      const edid = Number.parseInt(urlMatch[1], 10)
      if (!Number.isNaN(edid)) return edid
    }
  }

  if (card.image_file) {
    const fileMatch = card.image_file.match(/(\d+)\.(png|webp|jpg|jpeg)/i)
    if (fileMatch?.[1]) {
      const edid = Number.parseInt(fileMatch[1], 10)
      if (!Number.isNaN(edid)) return edid
    }

    const edid = Number.parseInt(card.image_file.replace(/\.(png|webp|jpg|jpeg)/i, ''), 10)
    if (!Number.isNaN(edid)) return edid
  }

  return 999999
}

function sortCards(cards: Card[], expansionOrder: Map<string, number>): Card[] {
  return [...cards].sort((a, b) => {
    const orderA = expansionOrder.get(a.expansion) ?? 999
    const orderB = expansionOrder.get(b.expansion) ?? 999

    if (orderA !== orderB) return orderB - orderA

    const rarityA = rarityOrder[a.rarity] ?? 999
    const rarityB = rarityOrder[b.rarity] ?? 999

    if (rarityA !== rarityB) return rarityA - rarityB

    if (a.expansion === 'Libertadores' && b.expansion === 'Libertadores') {
      const nameA = (a.name?.toLowerCase() ?? '').trim()
      const nameB = (b.name?.toLowerCase() ?? '').trim()
      const isCaleucheA = nameA.includes('caleuche')
      const isCaleucheB = nameB.includes('caleuche')
      const hasAniversarioA = a.image_url?.includes('25_aniversario') && !isCaleucheA ? 0 : 1
      const hasAniversarioB = b.image_url?.includes('25_aniversario') && !isCaleucheB ? 0 : 1

      if (hasAniversarioA !== hasAniversarioB) return hasAniversarioA - hasAniversarioB
    }

    return extractEdid(a) - extractEdid(b)
  })
}

function dedupeDeckBuilderCards(cards: Card[]): Card[] {
  const cardsById = new Map<string, Card>()
  cards.forEach((card) => cardsById.set(card.id, card))

  const cardsByName = new Map<string, Card[]>()
  Array.from(cardsById.values()).forEach((card) => {
    const normalizedName = card.name.trim().toLowerCase()
    const group = cardsByName.get(normalizedName) ?? []
    group.push(card)
    cardsByName.set(normalizedName, group)
  })

  const expansionPairs = [
    { older: 'Hielo Inmortal', newer: 'Cenizas de Fuego' },
    { older: 'Amenaza Kaiju', newer: 'Escuadron Mecha' }
  ]

  const finalCards: Card[] = []
  cardsByName.forEach((group) => {
    let cardsToKeep = [...group]

    expansionPairs.forEach((pair) => {
      const hasOlder = cardsToKeep.some((card) => card.expansion === pair.older)
      const hasNewer = cardsToKeep.some((card) => card.expansion === pair.newer)

      if (hasOlder && hasNewer) {
        cardsToKeep = cardsToKeep.filter((card) => card.expansion !== pair.older)
      }
    })

    finalCards.push(...cardsToKeep)
  })

  return finalCards
}

async function fetchAllActiveCards(): Promise<Card[]> {
  const supabase = getSupabase()
  const batchSize = 1000
  let from = 0
  let allCards: Card[] = []

  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select(CARD_SELECT)
      .eq('is_active', true)
      .range(from, from + batchSize - 1)

    if (error) throw error

    if (data?.length) {
      allCards = allCards.concat(data as unknown as Card[])
      from += batchSize
    }

    if (!data || data.length < batchSize) break
  }

  return allCards
}

async function fetchExpansionOrder(): Promise<Map<string, number>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('expansions')
    .select('name, display_order')
    .order('display_order', { ascending: true })

  if (error) throw error

  return new Map((data ?? []).map((exp) => [exp.name, exp.display_order]))
}

async function main() {
  const expansionOrder = await fetchExpansionOrder()
  const rotationStartOrder = expansionOrder.get(ROTATION_START_EXPANSION)

  if (rotationStartOrder === undefined) {
    throw new Error(`No se encontro la expansion de corte: ${ROTATION_START_EXPANSION}`)
  }

  const activeCards = await fetchAllActiveCards()
  const sortedCards = sortCards(activeCards, expansionOrder)
  const deckBuilderCards = dedupeDeckBuilderCards(sortedCards)
  const rotatedCards = await filterCardsInRotation(deckBuilderCards, 'Imperio Racial')
  const finalCards = sortCards(
    rotatedCards.filter((card) => (
      (expansionOrder.get(card.expansion) ?? 0) > rotationStartOrder &&
      isDeckBuilderCardAvailable(card)
    )),
    expansionOrder
  )

  const rows = finalCards.map((card) => ({
    id: card.id,
    nombre: card.name,
    tipo: card.type,
    coste: card.cost ?? '',
    fuerza: card.attack ?? '',
    defensa: card.defense ?? '',
    habilidad: card.description ?? '',
    rareza: card.rarity,
    raza: card.race ?? '',
    expansion: card.expansion,
    juego: card.game,
    imagen_url: card.image_url ?? '',
    imagen_archivo: card.image_file ?? '',
    edid: extractEdid(card)
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cartas disponibles')
  XLSX.writeFile(workbook, OUTPUT_PATH)

  const byExpansion = finalCards.reduce<Record<string, number>>((acc, card) => {
    acc[card.expansion] = (acc[card.expansion] ?? 0) + 1
    return acc
  }, {})

  console.log(`Excel creado: ${OUTPUT_PATH}`)
  console.log(`Cartas exportadas: ${finalCards.length}`)
  console.log(`Corte aplicado: solo expansiones con display_order > ${ROTATION_START_EXPANSION}`)
  console.log(`Expansiones excluidas: ${DECK_BUILDER_EXCLUDED_EXPANSIONS.join(', ')}`)
  console.log('Cartas por expansion:')
  Object.entries(byExpansion)
    .sort(([a], [b]) => (expansionOrder.get(b) ?? 999) - (expansionOrder.get(a) ?? 999))
    .forEach(([expansion, count]) => console.log(`- ${expansion}: ${count}`))
}

main().catch((error) => {
  console.error('Error exportando cartas:', error.message ?? error)
  process.exit(1)
})
