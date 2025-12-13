import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

// GET /api/cards/versions?name=xxx - Obtener todas las versiones de una carta por nombre
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'El parámetro "name" es requerido' },
        { status: 400 }
      )
    }

    // Buscar todas las versiones de la carta con ese nombre exacto
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .order('id', { ascending: true }) // Ordenar por ID para mantener consistencia

    if (error) {
      throw error
    }

    return NextResponse.json(cards || [])
  } catch (error) {
    console.error('Error fetching card versions:', error)
    return NextResponse.json(
      { error: 'Error al obtener las versiones de la carta' },
      { status: 500 }
    )
  }
}

