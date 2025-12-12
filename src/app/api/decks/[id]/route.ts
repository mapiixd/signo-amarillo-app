import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { requireAuth } from '@/lib/auth'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// DELETE /api/decks/[id] - Eliminar una baraja
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verificar que la baraja pertenece al usuario
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('user_id')
      .eq('id', id)
      .single()

    if (deckError) {
      throw deckError
    }

    if (!deck) {
      return NextResponse.json(
        { error: 'Baraja no encontrada' },
        { status: 404 }
      )
    }

    if (deck.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta baraja' },
        { status: 403 }
      )
    }

    // Eliminar la baraja
    const { error: deleteError } = await supabase
      .from('decks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting deck:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar la baraja' },
      { status: 500 }
    )
  }
}
