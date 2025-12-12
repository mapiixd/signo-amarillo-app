// Tipos de enumeración
export type CardType = 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
export type RarityType = 'VASALLO' | 'CORTESANO' | 'REAL' | 'MEGA_REAL' | 'ULTRA_REAL' | 'LEGENDARIA' | 'PROMO' | 'SECRETA'

// Constantes para usar en el código
export const CardType = {
  TALISMAN: 'TALISMAN' as const,
  ARMA: 'ARMA' as const,
  TOTEM: 'TOTEM' as const,
  ALIADO: 'ALIADO' as const,
  ORO: 'ORO' as const
}

export const RarityType = {
  VASALLO: 'VASALLO' as const,
  CORTESANO: 'CORTESANO' as const,
  REAL: 'REAL' as const,
  MEGA_REAL: 'MEGA_REAL' as const,
  ULTRA_REAL: 'ULTRA_REAL' as const,
  LEGENDARIA: 'LEGENDARIA' as const,
  PROMO: 'PROMO' as const,
  SECRETA: 'SECRETA' as const
}

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

// Estructura de carta en JSONB (dentro del mazo)
export type DeckCardEntry = {
  card_id: string
  quantity: number
}

export type Deck = {
  id: string
  name: string
  description: string | null
  user_id: string
  race: string | null  // Raza del mazo (Imperio Racial)
  format: string  // 'Imperio Racial', etc.
  is_public: boolean
  cards: DeckCardEntry[]  // Array JSONB de cartas del mazo principal
  sideboard: DeckCardEntry[]  // Array JSONB de cartas del sideboard
  created_at: string
  updated_at: string
}

// Tipos legacy - mantener para compatibilidad durante migración
export type DeckCard = {
  id: string
  deck_id: string
  card_id: string
  quantity: number
  created_at: string
}

export type DeckSideboard = {
  id: string
  deck_id: string
  card_id: string
  quantity: number
  created_at: string
}

// Alias para compatibilidad
export type SupabaseCard = Card
export type SupabaseDeck = Deck
export type SupabaseDeckCard = DeckCard

export type CardWithQuantity = Card & {
  quantity: number
}

// Mazo expandido con datos completos de las cartas
export type DeckWithCards = Omit<Deck, 'cards' | 'sideboard'> & {
  cards: (DeckCardEntry & {
    card: Card
  })[]
  sideboard: (DeckCardEntry & {
    card: Card
  })[]
}

// Tipo legacy - mantener para compatibilidad
export type DeckWithCardsLegacy = Deck & {
  deckCards: (DeckCard & {
    card: Card
  })[]
  sideboard?: (DeckSideboard & {
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

// Expansiones/Ediciones disponibles
export const EXPANSIONS = [
  'Amenaza Kaiju',
  'Bestiarium',
  'Cenizas de Fuego',
  'Escuadron Mecha',
  'Espiritu Samurai',
  'Giger',
  'Hielo Inmortal',
  'Kaiju VS Mecha: Titanes',
  'Libertadores',
  'Lootbox 2024',
  'Napoleon',
  'Onyria',
  'Raciales Imp 2024',
  'Secretos Arcanos',
  'Zodiaco'
] as const

// Razas disponibles para aliados
export const RACES = [
  'Bestia',
  'Caballero',
  'Dragón',
  'Eterno',
  'Faerie',
  'Guerrero',
  'Héroe',
  'Sacerdote',
  'Sombra',
  'Sin Raza'
] as const

// Mapeo de expansiones a rutas de carpetas de imágenes
export const EXPANSION_TO_PATH: Record<string, string> = {
  'Amenaza Kaiju': '/cards/amenazakaiju/',
  'Bestiarium': '/cards/bestiarium/',
  'Cenizas de Fuego': '/cards/cenizas_de_fuego/',
  'Escuadron Mecha': '/cards/escuadronmecha/',
  'Espiritu Samurai': '/cards/espiritu_samurai/',
  'Giger': '/cards/giger/',
  'Hielo Inmortal': '/cards/hielo_inmortal/',
  'Kaiju VS Mecha: Titanes': '/cards/kvsm_titanes/',
  'Libertadores': '/cards/libertadores/',
  'Lootbox 2024': '/cards/lootbox_2024/',
  'Napoleon': '/cards/napoleon/',
  'Onyria': '/cards/onyria/',
  'Raciales Imp 2024': '/cards/raciales_imp_2024/',
  'Secretos Arcanos': '/cards/secretos_arcanos/',
  'Zodiaco': '/cards/zodiaco/'
}
