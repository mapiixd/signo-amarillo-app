// Tipos de enumeración
export type CardType = 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
export type RarityType = 'VASALLO' | 'CORTESANO' | 'REAL' | 'MEGA_REAL' | 'ULTRA_REAL' | 'LEGENDARIA' | 'PROMO' | 'SECRETA'

// Tipos que coinciden con la base de datos de Supabase
export type Card = {
  id: string
  name: string
  type: CardType
  cost: number | null
  attack: number | null
  defense: number | null
  description: string | null
  image_url: string | null
  image_file: string | null
  rarity: RarityType
  race: string | null
  expansion: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Deck = {
  id: string
  name: string
  description: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export type DeckCard = {
  id: string
  deck_id: string
  card_id: string
  quantity: number
}

// Alias para compatibilidad
export type SupabaseCard = Card
export type SupabaseDeck = Deck
export type SupabaseDeckCard = DeckCard

export type CardWithQuantity = Card & {
  quantity: number
}

export type DeckWithCards = Deck & {
  deckCards: (DeckCard & {
    card: Card
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
