import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { token, newPassword } = body;

    // Validaciones básicas
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar token de recuperación
    const { data: resetTokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*, users(*)')
      .eq('token', token)
      .single();

    if (tokenError || !resetTokenData) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar que el token no haya expirado
    const expiresAt = new Date(resetTokenData.expiresat);
    if (expiresAt < new Date()) {
      // Eliminar token expirado
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      return NextResponse.json(
        { error: 'Token expirado. Solicita un nuevo enlace de recuperación.' },
        { status: 400 }
      );
    }

    const user = Array.isArray(resetTokenData.users) 
      ? resetTokenData.users[0] 
      : resetTokenData.users;

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 }
      );
    }

    // Eliminar el token usado y todos los tokens del usuario
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('userid', user.id);

    // Eliminar todas las sesiones activas del usuario (forzar re-login)
    await supabase
      .from('sessions')
      .delete()
      .eq('userId', user.id);

    console.log('Contraseña actualizada exitosamente para usuario:', user.username);

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

