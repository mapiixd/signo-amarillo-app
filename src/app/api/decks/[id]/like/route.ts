import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'

// POST /api/decks/[id]/like - Dar like o quitar like a un mazo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    const { id } = await params

    // Verificar que el mazo existe y es público
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, is_public')
      .eq('id', id)
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Mazo no encontrado' },
        { status: 404 }
      )
    }

    if (!deck.is_public) {
      return NextResponse.json(
        { error: 'Este mazo no es público' },
        { status: 403 }
      )
    }

    // Verificar si el usuario ya dio like
    const { data: existingLike, error: likeError } = await supabase
      .from('deck_likes')
      .select('id')
      .eq('deck_id', id)
      .eq('user_id', user.id)
      .single()

    if (likeError && likeError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw likeError
    }

    if (existingLike) {
      // Quitar like
      const { error: deleteError } = await supabase
        .from('deck_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({ liked: false })
    } else {
      // Dar like
      const { error: insertError } = await supabase
        .from('deck_likes')
        .insert({
          deck_id: id,
          user_id: user.id
        })

      if (insertError) {
        throw insertError
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error: any) {
    console.error('Error toggling like:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al dar like al mazo' },
      { status: 500 }
    )
  }
}

// GET /api/decks/[id]/like - Verificar si el usuario dio like
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient()
    const user = await requireAuth()
    const { id } = await params

    const { data: like, error } = await supabase
      .from('deck_likes')
      .select('id')
      .eq('deck_id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({ liked: !!like })
  } catch (error: any) {
    console.error('Error checking like:', error)
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al verificar like' },
      { status: 500 }
    )
  }
}

