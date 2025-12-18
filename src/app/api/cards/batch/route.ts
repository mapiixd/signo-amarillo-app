import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/cards/batch - Obtener cartas por IDs
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs' },
        { status: 400 }
      )
    }

    // Obtener todas las cartas con los IDs proporcionados
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .in('id', ids)

    if (error) {
      console.error('Error fetching cards:', error)
      return NextResponse.json(
        { error: 'Error al obtener las cartas' },
        { status: 500 }
      )
    }

    return NextResponse.json({ cards: cards || [] })
  } catch (error) {
    console.error('Error in batch cards endpoint:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}



