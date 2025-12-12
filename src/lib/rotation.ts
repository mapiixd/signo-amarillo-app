// Sistema de rotación de cartas
// Solo las cartas desde "Espiritu Samurai" en adelante están disponibles para crear barajas

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
      console.warn('No se pudo determinar el orden de inicio de rotación, retornando todas las expansiones')
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
 * Limpia el cache del orden de inicio de rotación
 * Útil para refrescar después de cambios en la base de datos
 */
export function clearRotationCache(): void {
  rotationStartOrder = null
}
