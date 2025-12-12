// Sistema de rotación de cartas
// Solo las cartas desde "Espiritu Samurai" en adelante están disponibles para crear barajas
// Además, hay cartas reimpresas que están en rotación independientemente de su expansión original

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const ROTATION_START_EXPANSION = 'Espiritu Samurai'

// Cache para el display_order de la expansión de inicio de rotación
let rotationStartOrder: number | null = null

/**
 * Cartas específicas que están en rotación para el formato "Imperio Racial"
 * independientemente de su expansión original.
 * Estas son cartas reimpresas que rotan en la edición especificada.
 * 
 * Formato: nombre de carta (normalizado) -> expansión de rotación
 */
const ROTATED_CARDS_IMPERIO_RACIAL: Record<string, string> = {
  'Monumento Inmortal': 'Onyria',
  'Horda Tenebris': 'Libertadores',
  'Espíritu Desafiante': 'Libertadores',
  'Legión Paladín': 'Libertadores',
  'Escarapela Nacional': 'Libertadores',
  'Cuervo Nocturno': 'Onyria',
  'Trempilcahue': 'Libertadores',
  'Tempilcahue': 'Libertadores',
  'Caleuche': 'Libertadores',
  'El Caleuche': 'Libertadores',
  'Jabberwocky': 'Onyria',
  'Ereshkigal': 'Bestiarium',
  'Sombrerero Loco': 'Onyria',
  'Conde Drácula': 'Onyria',
  'Frankenstein o El moderno Prometeo': 'Onyria',
  'Frankenstein o El nuevo Prometeo': 'Onyria',
  'Estaca': 'Onyria',
  'Visión Heróica': 'Onyria',
  'Piedra del Chamán': 'Bestiarium',
  'Yelmo Vendel': 'Bestiarium',
  'Sheut': 'Bestiarium',
  'León Indiferente': 'Onyria',
  'Biblioteca de Caballería': 'Onyria',
  'Depredar': 'Onyria',
  'Lágrima de Dragón': 'Bestiarium',
  'Malevolente': 'Napoleon',
  'Invocar Anfibios': 'Bestiarium',
  'Golpe Fulminante': 'Espiritu Samurai',
  'Nombre de Horus': 'Napoleon',
  'Niten Ichi-Ryu': 'Espiritu Samurai',
  'Anillo de Vacio': 'Espiritu Samurai',
  'Anillo del Vacío': 'Espiritu Samurai',
  'Mandjet': 'Napoleon',
  'Envenenar': 'Napoleon',
  'Nihon Koryo Jujutsu': 'Espiritu Samurai',
  'Gran Khopesh': 'Napoleon',
  'Amuleto de Thor': 'Napoleon',
  'Jujitsu': 'Espiritu Samurai',
  'Parche Pirata': 'Napoleon',
  'Barnstokkr': 'Napoleon',
  'Beso de Loto': 'Espiritu Samurai',
  'Bifrost': 'Napoleon',
  'Blasfemia': 'Napoleon',
  'Juicio de Osiris': 'Napoleon',
  'Frasco Canopico': 'Napoleon',
  'Frasco Canópico': 'Napoleon',
  'Koto': 'Espiritu Samurai',
  'Templo de Uppsala': 'Napoleon',
  'Ankh': 'Napoleon',
  'Expulsión': 'Napoleon',
  'Llamada Salvaje': 'Napoleon',
  'Armadura Imperial': 'Espiritu Samurai',
  'Honjo Masamune': 'Espiritu Samurai',
  'Fantasma del Puente': 'Napoleon',
  'Animita': 'Napoleon',
  'Mjolnir': 'Raciales Imp 2024',
}

/**
 * Normaliza el nombre de una carta para comparación
 * Elimina espacios extra y convierte a minúsculas
 */
function normalizeCardName(name: string): string {
  return name.trim()
}

/**
 * Verifica si una carta específica está en la lista de rotación individual
 * y si su edición de rotación está disponible (tiene display_order >= Espiritu Samurai)
 * @param cardName Nombre de la carta a verificar
 * @param format Formato del juego (actualmente solo 'Imperio Racial')
 * @returns Promise<boolean> true si la carta está en rotación individual Y su edición de rotación está disponible, false en caso contrario
 */
export async function isCardInIndividualRotation(cardName: string, format: string = 'Imperio Racial'): Promise<boolean> {
  if (format !== 'Imperio Racial') {
    return false
  }

  const normalizedName = normalizeCardName(cardName).toLowerCase()
  
  // Buscar coincidencia exacta primero
  for (const [key, rotationExpansion] of Object.entries(ROTATED_CARDS_IMPERIO_RACIAL)) {
    const normalizedKey = normalizeCardName(key).toLowerCase()
    if (normalizedName === normalizedKey) {
      // Verificar si la edición de rotación está en rotación (display_order >= Espiritu Samurai)
      return await isExpansionInRotation(rotationExpansion)
    }
  }
  
  // Si no hay coincidencia exacta, buscar coincidencia parcial bidireccional
  // Esto maneja casos como "Caleuche" vs "El Caleuche" o variaciones de nombres
  for (const [key, rotationExpansion] of Object.entries(ROTATED_CARDS_IMPERIO_RACIAL)) {
    const normalizedKey = normalizeCardName(key).toLowerCase()
    const isPartialMatch = (normalizedName.includes(normalizedKey) && normalizedKey.length >= 5) ||
                           (normalizedKey.includes(normalizedName) && normalizedName.length >= 5)
    
    if (isPartialMatch) {
      // Verificar si la edición de rotación está en rotación (display_order >= Espiritu Samurai)
      return await isExpansionInRotation(rotationExpansion)
    }
  }
  
  return false
}

/**
 * Obtiene la expansión de rotación para una carta específica
 * @param cardName Nombre de la carta
 * @param format Formato del juego
 * @returns Nombre de la expansión de rotación o null si no está en rotación individual
 */
export function getCardRotationExpansion(cardName: string, format: string = 'Imperio Racial'): string | null {
  if (format !== 'Imperio Racial') {
    return null
  }

  const normalizedName = normalizeCardName(cardName).toLowerCase()
  
  // Primero buscar coincidencia exacta
  for (const [key, rotationExpansion] of Object.entries(ROTATED_CARDS_IMPERIO_RACIAL)) {
    const normalizedKey = normalizeCardName(key).toLowerCase()
    if (normalizedName === normalizedKey) {
      return rotationExpansion
    }
  }
  
  // Si no hay coincidencia exacta, buscar coincidencia parcial
  for (const [key, rotationExpansion] of Object.entries(ROTATED_CARDS_IMPERIO_RACIAL)) {
    const normalizedKey = normalizeCardName(key).toLowerCase()
    if ((normalizedName.includes(normalizedKey) && normalizedKey.length >= 5) ||
        (normalizedKey.includes(normalizedName) && normalizedName.length >= 5)) {
      return rotationExpansion
    }
  }
  
  return null
}

/**
 * Obtiene el display_order de la expansión que marca el inicio de la rotación
 * @returns El display_order de "Espiritu Samurai" o null si no se encuentra
 */
export async function getRotationStartOrder(): Promise<number | null> {
  // Usar cache si está disponible
  if (rotationStartOrder !== null) {
    return rotationStartOrder
  }

  try {
    const { data: expansion, error } = await supabase
      .from('expansions')
      .select('display_order')
      .eq('name', ROTATION_START_EXPANSION)
      .single()

    if (error || !expansion) {
      console.error('Error fetching rotation start expansion:', error)
      return null
    }

    rotationStartOrder = expansion.display_order
    return rotationStartOrder
  } catch (error) {
    console.error('Error in getRotationStartOrder:', error)
    return null
  }
}

/**
 * Obtiene las expansiones que están en rotación (desde Espiritu Samurai en adelante)
 * @returns Array de nombres de expansiones en rotación
 */
export async function getRotatedExpansions(): Promise<string[]> {
  try {
    const startOrder = await getRotationStartOrder()
    
    if (startOrder === null) {
      console.warn('No se pudo determinar el orden de inicio de rotación (Espiritu Samurai)')
      return []
    }

    const { data: expansions, error } = await supabase
      .from('expansions')
      .select('name')
      .gte('display_order', startOrder)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching rotated expansions:', error)
      return []
    }

    if (!expansions || expansions.length === 0) {
      console.warn(`No se encontraron expansiones con display_order >= ${startOrder}`)
      return []
    }

    return expansions.map(exp => exp.name)
  } catch (error) {
    console.error('Error in getRotatedExpansions:', error)
    return []
  }
}

/**
 * Verifica si una expansión está en rotación
 * @param expansionName Nombre de la expansión a verificar
 * @returns true si la expansión está en rotación, false en caso contrario
 */
export async function isExpansionInRotation(expansionName: string): Promise<boolean> {
  try {
    const startOrder = await getRotationStartOrder()
    
    if (startOrder === null) {
      // Si no se puede determinar, permitir todas por defecto
      return true
    }

    const { data: expansion, error } = await supabase
      .from('expansions')
      .select('display_order')
      .eq('name', expansionName)
      .single()

    if (error || !expansion) {
      // Si la expansión no existe, no está en rotación
      return false
    }

    return expansion.display_order >= startOrder
  } catch (error) {
    console.error('Error in isExpansionInRotation:', error)
    return false
  }
}

/**
 * Verifica si una carta está en rotación
 * Una carta está en rotación si:
 * 1. La carta específica está en la lista de rotación individual Y su edición de rotación tiene display_order >= Espiritu Samurai, O
 * 2. La carta NO está en la lista pero su expansión tiene display_order >= Espiritu Samurai
 * 
 * IMPORTANTE: Todas las expansiones con display_order menor que Espiritu Samurai están rotadas
 * y sus cartas NO están disponibles en el editor de mazos.
 * 
 * @param cardName Nombre de la carta
 * @param expansionName Nombre de la expansión de la carta
 * @param format Formato del juego (por defecto 'Imperio Racial')
 * @returns true si la carta está en rotación, false en caso contrario
 */
export async function isCardInRotation(
  cardName: string,
  expansionName: string,
  format: string = 'Imperio Racial'
): Promise<boolean> {
  // Verificar si la carta está en la lista de rotación individual
  const rotationExpansion = getCardRotationExpansion(cardName, format)
  
  if (rotationExpansion !== null) {
    // Si está en la lista, verificar que su edición de rotación tenga display_order >= Espiritu Samurai
    // Esto asegura que solo aparezcan cartas de expansiones que NO han rotado
    return await isExpansionInRotation(rotationExpansion)
  }

  // Si no está en la lista, verificar por expansión normal
  // Verificar si la expansión tiene display_order >= Espiritu Samurai
  return await isExpansionInRotation(expansionName)
}

/**
 * Obtiene todas las cartas que están en rotación (por expansión o individualmente)
 * Útil para filtrar cartas en la API
 * 
 * IMPORTANTE: 
 * - Todas las expansiones con display_order < Espiritu Samurai están rotadas y NO están disponibles
 * - Las cartas en la lista de rotación individual solo aparecen si su edición de rotación tiene display_order >= Espiritu Samurai
 * - Las cartas que NO están en la lista solo aparecen si su expansión tiene display_order >= Espiritu Samurai
 * 
 * @param cards Array de cartas con propiedades name y expansion
 * @param format Formato del juego
 * @returns Array de cartas que están en rotación
 */
export async function filterCardsInRotation<T extends { name: string; expansion: string }>(
  cards: T[],
  format: string = 'Imperio Racial'
): Promise<T[]> {
  try {
    const rotatedExpansions = await getRotatedExpansions()
    
    // Si no se pueden obtener las expansiones rotadas, retornar array vacío para evitar mostrar cartas incorrectas
    if (!rotatedExpansions || rotatedExpansions.length === 0) {
      console.warn('No se pudieron obtener las expansiones en rotación, filtrando todas las cartas')
      return []
    }
    
    const rotatedExpansionsSet = new Set(rotatedExpansions)
    
    // Crear un mapa de expansiones de rotación a su disponibilidad (cache)
    const rotationExpansionCache = new Map<string, boolean>()

    return cards.filter(card => {
      // Verificar si la carta está en la lista de rotación individual
      const rotationExpansion = getCardRotationExpansion(card.name, format)
      
      if (rotationExpansion !== null) {
        // Si está en la lista, verificar si su edición de rotación está disponible
        // Usar cache para evitar múltiples consultas
        if (!rotationExpansionCache.has(rotationExpansion)) {
          // Verificar si la expansión de rotación está en el set de expansiones rotadas
          const isAvailable = rotatedExpansionsSet.has(rotationExpansion)
          rotationExpansionCache.set(rotationExpansion, isAvailable)
        }
        return rotationExpansionCache.get(rotationExpansion) === true
      }

      // Si no está en la lista, verificar por expansión normal
      // Solo incluir si la expansión tiene display_order >= Espiritu Samurai
      return rotatedExpansionsSet.has(card.expansion)
    })
  } catch (error) {
    console.error('Error en filterCardsInRotation:', error)
    // En caso de error, retornar array vacío para evitar mostrar cartas incorrectas
    return []
  }
}

/**
 * Limpia el cache del orden de inicio de rotación
 * Útil para refrescar después de cambios en la base de datos
 */
export function clearRotationCache(): void {
  rotationStartOrder = null
}
