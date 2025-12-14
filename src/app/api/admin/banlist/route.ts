import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { clearBanlistCache } from '@/lib/banlist'

// GET /api/admin/banlist - Obtener todas las entradas de banlist
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
      throw error
    }

    return NextResponse.json({ entries: data || [] })
  } catch (error) {
    console.error('Error fetching banlist entries:', error)
    return NextResponse.json(
      { error: 'Error al obtener las entradas de banlist' },
      { status: 500 }
    )
  }
}

// POST /api/admin/banlist - Crear o actualizar una entrada de banlist
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { card_name, format, status, max_copies } = body

    if (!card_name || !format || !status || max_copies === undefined) {
      return NextResponse.json(
        { error: 'card_name, format, status y max_copies son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato
    if (!['Imperio Racial', 'VCR', 'Triadas'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido' },
        { status: 400 }
      )
    }

    // Validar status
    if (!['banned', 'limited-1', 'limited-2', 'allowed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Validar max_copies
    if (max_copies < 0 || max_copies > 3) {
      return NextResponse.json(
        { error: 'max_copies debe estar entre 0 y 3' },
        { status: 400 }
      )
    }

    // Insertar o actualizar (upsert)
    const { data, error } = await supabase
      .from('banlist_entries')
      .upsert({
        card_name,
        format,
        status,
        max_copies,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'card_name,format'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Limpiar cache
    clearBanlistCache()

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating banlist entry:', error)
    return NextResponse.json(
      { error: 'Error al crear/actualizar la entrada de banlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/banlist - Eliminar una entrada de banlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const card_name = searchParams.get('card_name')
    const format = searchParams.get('format')

    if (!card_name || !format) {
      return NextResponse.json(
        { error: 'card_name y format son requeridos' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('banlist_entries')
      .delete()
      .eq('card_name', card_name)
      .eq('format', format)

    if (error) {
      throw error
    }

    // Limpiar cache
    clearBanlistCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting banlist entry:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la entrada de banlist' },
      { status: 500 }
    )
  }
}
