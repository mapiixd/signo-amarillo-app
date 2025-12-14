import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { clearRotationCardsCache } from '@/lib/rotation'

// GET /api/admin/rotation - Obtener todas las entradas de rotación
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    let query = supabase
      .from('rotation_entries')
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
    console.error('Error fetching rotation entries:', error)
    return NextResponse.json(
      { error: 'Error al obtener las entradas de rotación' },
      { status: 500 }
    )
  }
}

// POST /api/admin/rotation - Crear o actualizar una entrada de rotación
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { card_name, format, rotation_expansion } = body

    if (!card_name || !format || !rotation_expansion) {
      return NextResponse.json(
        { error: 'card_name, format y rotation_expansion son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la expansión existe
    const { data: expansion, error: expansionError } = await supabase
      .from('expansions')
      .select('name')
      .eq('name', rotation_expansion)
      .single()

    if (expansionError || !expansion) {
      return NextResponse.json(
        { error: 'La expansión especificada no existe' },
        { status: 400 }
      )
    }

    // Insertar o actualizar (upsert)
    const { data, error } = await supabase
      .from('rotation_entries')
      .upsert({
        card_name,
        format,
        rotation_expansion,
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
    clearRotationCardsCache()

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating rotation entry:', error)
    return NextResponse.json(
      { error: 'Error al crear/actualizar la entrada de rotación' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/rotation - Eliminar una entrada de rotación
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
      .from('rotation_entries')
      .delete()
      .eq('card_name', card_name)
      .eq('format', format)

    if (error) {
      throw error
    }

    // Limpiar cache
    clearRotationCardsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rotation entry:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la entrada de rotación' },
      { status: 500 }
    )
  }
}
