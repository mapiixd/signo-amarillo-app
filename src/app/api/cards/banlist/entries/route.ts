import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { type FormatType, type BanlistEntry } from '@/lib/banlist'

// GET /api/cards/banlist/entries - Obtener todas las entradas de banlist (pública)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    let query = supabase
      .from('banlist_entries')
      .select('*')
      .order('card_name', { ascending: true })

    if (format) {
      query = query.eq('format', format)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching banlist entries:', error)
      return NextResponse.json(
        { error: 'Error al obtener las entradas de banlist' },
        { status: 500 }
      )
    }

    // Transformar los datos para que coincidan con el formato esperado
    const entries = (data || []).map((entry: any) => ({
      card_name: entry.card_name,
      format: entry.format,
      status: entry.status,
      max_copies: entry.max_copies
    }))

    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('Error fetching banlist entries:', error)
    return NextResponse.json(
      { error: 'Error al obtener las entradas de banlist' },
      { status: 500 }
    )
  }
}

