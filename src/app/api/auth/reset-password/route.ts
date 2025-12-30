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
    console.log('Buscando token de recuperación:', token);
    
    // Primero buscar el token
    const { data: resetTokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    console.log('Resultado de búsqueda de token:', {
      found: !!resetTokenData,
      error: tokenError,
      tokenData: resetTokenData ? {
        id: resetTokenData.id,
        userid: resetTokenData.userid,
        expiresat: resetTokenData.expiresat
      } : null
    });

    if (tokenError) {
      console.error('Error buscando token:', tokenError);
      // Si el error es porque no se encontró, dar mensaje más específico
      if (tokenError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Token inválido o expirado' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Token inválido o expirado', details: tokenError.message },
        { status: 400 }
      );
    }

    if (!resetTokenData) {
      console.log('Token no encontrado en la base de datos');
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar que el token no haya expirado
    // Parsear la fecha correctamente (Supabase devuelve timestamptz como string en UTC)
    const expiresAtStr = resetTokenData.expiresat;
    const expiresAt = new Date(expiresAtStr);
    // Usar UTC para la comparación para evitar problemas de zona horaria
    const now = new Date();
    const nowUTC = new Date(now.toISOString());
    
    // Verificar que la fecha se parseó correctamente
    if (isNaN(expiresAt.getTime())) {
      console.error('Error parseando fecha de expiración:', expiresAtStr);
      return NextResponse.json(
        { error: 'Error al verificar el token' },
        { status: 500 }
      );
    }

    // Comparar usando timestamps (milisegundos desde epoch) para evitar problemas de zona horaria
    const expiresAtTimestamp = expiresAt.getTime();
    const nowTimestamp = now.getTime();
    const isExpired = expiresAtTimestamp < nowTimestamp;
    const diffMinutes = Math.round((expiresAtTimestamp - nowTimestamp) / 1000 / 60);

    console.log('Verificando expiración (UTC):', {
      expiresAtRaw: expiresAtStr,
      expiresAtUTC: expiresAt.toISOString(),
      expiresAtTimestamp: expiresAtTimestamp,
      nowUTC: now.toISOString(),
      nowTimestamp: nowTimestamp,
      isExpired: isExpired,
      diffMinutes: diffMinutes,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    if (isExpired) {
      console.log('Token expirado, eliminando...');
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

    console.log('Token válido, tiempo restante:', diffMinutes, 'minutos');

    // Buscar el usuario asociado al token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', resetTokenData.userid)
      .single();

    if (userError || !user) {
      console.error('Error buscando usuario:', userError);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('Usuario encontrado:', { id: user.id, username: user.username });

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

