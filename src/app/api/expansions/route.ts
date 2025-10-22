import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/expansions - Obtener todas las expansiones en orden
export async function GET() {
  try {
    const { data: expansions, error } = await supabase
      .from('expansions')
      .select('*')
      .order('display_order', { ascending: true })

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

