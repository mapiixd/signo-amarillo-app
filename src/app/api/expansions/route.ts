import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

// Forzar que esta ruta sea dinámica para evitar ejecución durante el build
export const dynamic = 'force-dynamic'

// GET /api/expansions - Obtener todas las expansiones en orden
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const { data: expansions, error } = await supabase
      .from('expansions')
      .select('*')
      .order('display_order', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(expansions)
  } catch (error) {
    console.error('Error fetching expansions:', error)
    return NextResponse.json(
      { error: 'Error al obtener las expansiones' },
      { status: 500 }
    )
  }
}

