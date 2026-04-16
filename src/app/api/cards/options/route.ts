import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('cards')
      .select('type, race, rarity')
      .eq('is_active', true)

    if (error) {
      throw error
    }

    const types = Array.from(new Set((data || []).map((card) => card.type).filter(Boolean))).sort()
    const rarities = Array.from(new Set((data || []).map((card) => card.rarity).filter(Boolean))).sort()
    const races = Array.from(
      new Set(
        (data || [])
          .flatMap((card) => (card.race || '').split('/'))
          .map((race) => race.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))

    return NextResponse.json({
      types,
      rarities,
      races: [...races, 'Sin Raza']
    })
  } catch (error) {
    console.error('Error fetching card options:', error)
    return NextResponse.json(
      { error: 'Error al obtener las opciones de cartas' },
      { status: 500 }
    )
  }
}
