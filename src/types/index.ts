import { Card, Deck, DeckCard, CardType, RarityType } from '@prisma/client'

// Tipos que coinciden con la base de datos de Supabase
export type SupabaseCard = {
  id: string
  name: string
  type: 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
  cost: number | null
  attack: number | null
  defense: number | null
  description: string | null
  image_url: string | null
  image_file: string | null
  rarity: 'VASALLO' | 'CORTESANO' | 'REAL' | 'MEGA_REAL' | 'ULTRA_REAL' | 'LEGENDARIA' | 'PROMO' | 'SECRETA'
  expansion: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SupabaseDeck = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type SupabaseDeckCard = {
  id: string
  deck_id: string
  card_id: string
  quantity: number
}

export type CardWithQuantity = SupabaseCard & {
  quantity: number
}

export type DeckWithCards = SupabaseDeck & {
  deckCards: (SupabaseDeckCard & {
    card: SupabaseCard
  })[]
}

// Tipos del formato Imperio
export type ImperioCardType = CardType
export type ImperioRarityType = RarityType

// Etiquetas legibles para la UI
export const CARD_TYPE_LABELS: Record<ImperioCardType, string> = {
  TALISMAN: 'Talismán',
  ARMA: 'Arma',
  TOTEM: 'Tótem',
  ALIADO: 'Aliado',
  ORO: 'Oro'
}

export const RARITY_TYPE_LABELS: Record<ImperioRarityType, string> = {
  VASALLO: 'Vasallo',
  CORTESANO: 'Cortesano',
  REAL: 'Real',
  MEGA_REAL: 'Mega Real',
  ULTRA_REAL: 'Ultra Real',
  LEGENDARIA: 'Legendaria',
  PROMO: 'Promo',
  SECRETA: 'Secreta'
}
