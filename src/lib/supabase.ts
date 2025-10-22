import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string
          name: string
          type: 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
          cost: number | null
          attack: number | null
          defense: number | null
          description: string | null
          imageUrl: string | null
          imageFile: string | null
          rarity: 'COMUN' | 'POCO_COMUN' | 'RARA' | 'MITICA' | 'LEGENDARIA'
          expansion: string
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          type: 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
          cost?: number | null
          attack?: number | null
          defense?: number | null
          description?: string | null
          imageUrl?: string | null
          imageFile?: string | null
          rarity: 'COMUN' | 'POCO_COMUN' | 'RARA' | 'MITICA' | 'LEGENDARIA'
          expansion: string
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
          cost?: number | null
          attack?: number | null
          defense?: number | null
          description?: string | null
          imageUrl?: string | null
          imageFile?: string | null
          rarity?: 'COMUN' | 'POCO_COMUN' | 'RARA' | 'MITICA' | 'LEGENDARIA'
          expansion?: string
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      decks: {
        Row: {
          id: string
          name: string
          description: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      deck_cards: {
        Row: {
          id: string
          deckId: string
          cardId: string
          quantity: number
        }
        Insert: {
          id?: string
          deckId: string
          cardId: string
          quantity?: number
        }
        Update: {
          id?: string
          deckId?: string
          cardId?: string
          quantity?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      card_type: 'TALISMAN' | 'ARMA' | 'TOTEM' | 'ALIADO' | 'ORO'
      rarity_type: 'COMUN' | 'POCO_COMUN' | 'RARA' | 'MITICA' | 'LEGENDARIA'
    }
  }
}
