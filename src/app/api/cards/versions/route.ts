import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/cards/versions?name=xxx - Obtener todas las versiones de una carta por nombre
export async function GET(request: NextRequest) {
  try {
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

