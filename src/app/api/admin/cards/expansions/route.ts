import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

// GET /api/admin/cards/expansions - Obtener todas las expansiones disponibles
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const { data: expansions, error } = await supabase
      .from('expansions')
      .select('name')
      .order('display_order', { ascending: false })

    if (error) {
      throw error
    }

    const expansionNames = expansions.map(exp => exp.name)

    return NextResponse.json({ expansions: expansionNames })
  } catch (error) {
    console.error('Error fetching expansions:', error)
    return NextResponse.json(
      { error: 'Error al obtener las expansiones' },
      { status: 500 }
    )
  }
}
