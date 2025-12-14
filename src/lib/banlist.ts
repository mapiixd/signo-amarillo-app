// Sistema de baneos y restricciones por formato

import { getSupabaseClient } from './supabase-server'

export type BanStatus = 'banned' | 'limited-1' | 'limited-2' | 'allowed'

export interface BanlistEntry {
  cardName: string
  status: BanStatus
  maxCopies: number // 0 = prohibida, 1 = limitada a 1, 2 = limitada a 2, 3 = normal
}

export type FormatType = 'Imperio Racial' | 'VCR' | 'Triadas'

// Cache para las banlists
let banlistCache: Record<FormatType, BanlistEntry[]> | null = null
let banlistCacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene todas las banlists desde la base de datos
 */
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
          status: entry.status as BanStatus,
          maxCopies: entry.max_copies
        })
      }
    })
  }

  return banlists
}

/**
 * Obtiene las banlists (con cache)
 */
async function getBanlists(): Promise<Record<FormatType, BanlistEntry[]>> {
  const now = Date.now()
  
  // Si el cache es válido, retornarlo
  if (banlistCache && (now - banlistCacheTimestamp) < CACHE_DURATION) {
    return banlistCache
  }

  // Obtener de la base de datos y actualizar cache
  banlistCache = await getBanlistsFromDB()
  banlistCacheTimestamp = now
  return banlistCache
}

/**
 * Limpia el cache de banlists (útil después de actualizaciones)
 */
export function clearBanlistCache(): void {
  banlistCache = null
  banlistCacheTimestamp = 0
}

// Función para obtener el estado de una carta en un formato específico
export async function getCardBanStatus(cardName: string, format: FormatType): Promise<BanlistEntry | null> {
  const banlists = await getBanlists()
  const banlist = banlists[format]
  if (!banlist) return null
  
  // Buscar coincidencia exacta (ignorando mayúsculas/minúsculas y espacios al inicio/final)
  const normalizedCardName = cardName.trim().toLowerCase()
  return banlist.find(entry => 
    entry.cardName.trim().toLowerCase() === normalizedCardName
  ) || null
}

// Función para verificar si una carta está prohibida
export async function isCardBanned(cardName: string, format: FormatType): Promise<boolean> {
  const status = await getCardBanStatus(cardName, format)
  return status?.status === 'banned'
}

// Función para obtener el máximo de copias permitidas
export async function getMaxCopies(cardName: string, format: FormatType): Promise<number> {
  const status = await getCardBanStatus(cardName, format)
  return status?.maxCopies ?? 3 // Por defecto, 3 copias
}

// Función sincrónica para obtener banlists (para compatibilidad con código existente)
// Nota: Esta función puede retornar datos desactualizados si el cache no está actualizado
export function getBanlistsSync(): Record<FormatType, BanlistEntry[]> {
  if (!banlistCache) {
    // Si no hay cache, retornar vacío (el código async debería inicializarlo)
    return {
      'Imperio Racial': [],
      'VCR': [],
      'Triadas': []
    }
  }
  return banlistCache
}

// Función para obtener el icono según el estado
export function getBanStatusIcon(status: BanStatus): string {
  switch (status) {
    case 'banned':
      return '⛔'
    case 'limited-1':
    case 'limited-2':
      return '☢️'
    default:
      return ''
  }
}

// Función para obtener la etiqueta de texto
export function getBanStatusLabel(status: BanStatus, maxCopies: number): string {
  switch (status) {
    case 'banned':
      return 'PROHIBIDA'
    case 'limited-1':
      return 'Limitada a 1 copia'
    case 'limited-2':
      return 'Limitada a 2 copias'
    default:
      return ''
  }
}

