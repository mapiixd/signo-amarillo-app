import { createClient } from '@supabase/supabase-js'

/**
 * Obtener cliente de Supabase para uso en el servidor
 * Inicializa el cliente solo cuando es necesario (lazy initialization)
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Validar que las variables de entorno estén disponibles
  if (!supabaseUrl || !supabaseKey) {
    // Lanzar error descriptivo si faltan las variables requeridas
    throw new Error(
      'supabaseUrl is required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    )
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

