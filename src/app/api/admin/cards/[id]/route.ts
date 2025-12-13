import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

// GET /api/admin/cards/[id] - Obtener una carta específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await params
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Carta no encontrada' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error fetching card:', error)
    return NextResponse.json(
      { error: 'Error al obtener la carta' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/cards/[id] - Actualizar una carta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await params
    const body = await request.json()
    const {
      name,
      type,
      cost,
      attack,
      defense,
      description,
      imageUrl,
      imageFile,
      rarity,
      expansion,
      race,
      isActive
    } = body

    if (!name || !type || !rarity || !expansion) {
      return NextResponse.json(
        { error: 'Nombre, tipo, rareza y expansión son requeridos' },
        { status: 400 }
      )
    }

    // Fecha actual para updated_at
    const now = new Date().toISOString()

    const { data: card, error } = await supabase
      .from('cards')
      .update({
        name,
        type,
        cost: cost !== undefined && cost !== '' ? parseInt(cost) : null,
        attack: attack !== undefined && attack !== '' ? parseInt(attack) : null,
        defense: defense !== undefined && defense !== '' ? parseInt(defense) : null,
        description,
        image_url: imageUrl,
        image_file: imageFile,
        rarity,
        expansion,
        race: race || null,
        is_active: isActive || false,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Error updating card:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la carta' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cards/[id] - Eliminar una carta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const { id } = await params
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting card:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la carta' },
      { status: 500 }
    )
  }
}
