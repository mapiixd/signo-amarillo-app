import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/admin/cards/expansions - Obtener todas las expansiones disponibles
export async function GET() {
  try {
    const { data: expansions, error } = await supabase
      .from('cards')
      .select('expansion')
      .order('expansion')

    if (error) {
      throw error
    }

    // Obtener expansiones únicas y ordenadas
    const uniqueExpansions = Array.from(new Set(expansions.map(card => card.expansion)))
      .filter(expansion => expansion && expansion.trim() !== '')
      .sort()

    return NextResponse.json({ expansions: uniqueExpansions })
  } catch (error) {
    console.error('Error fetching expansions:', error)
    return NextResponse.json(
      { error: 'Error al obtener las expansiones' },
      { status: 500 }
    )
  }
}
