import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verificar que el email esté configurado
    if (!isEmailConfigured()) {
      console.error('Email no configurado: GMAIL_EMAIL y GMAIL_APP_PASSWORD deben estar configurados');
      return NextResponse.json(
        { error: 'El servicio de correo no está configurado. Contacta al administrador.' },
        { status: 503 }
      );
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { email } = body;

    // Validaciones básicas
    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('email', email)
      .limit(1);

    // Por seguridad, siempre devolvemos éxito aunque el usuario no exista
    // Esto previene la enumeración de usuarios
    if (queryError || !users || users.length === 0) {
      console.log('Usuario no encontrado para email:', email);
      return NextResponse.json({
        message: 'Si el correo existe, se ha enviado un enlace de recuperación',
      });
    }

    const user = users[0];

    // Generar token de recuperación único
    const resetToken = randomUUID();
    // Crear fecha de expiración (1 hora desde ahora)
    // Usar toISOString() asegura que se guarde en UTC en la base de datos
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Eliminar tokens de recuperación anteriores del usuario
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('userid', user.id);

    // Guardar token en la base de datos
    console.log('Guardando token de recuperación:', {
      userId: user.id,
      token: resetToken,
      expiresAt: expiresAt.toISOString()
    });

    const { data: insertedToken, error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        id: randomUUID(),
        userid: user.id,
        token: resetToken,
        expiresat: expiresAt.toISOString(), // toISOString() siempre devuelve UTC
        createdat: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error guardando token de recuperación:', insertError);
      return NextResponse.json(
        { error: 'Error al procesar la solicitud' },
        { status: 500 }
      );
    }

    console.log('Token guardado exitosamente:', {
      id: insertedToken?.id,
      token: insertedToken?.token,
      userid: insertedToken?.userid
    });

    // Enviar correo de recuperación
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.username);
      console.log('Correo de recuperación enviado a:', user.email);
    } catch (emailError) {
      console.error('Error enviando correo:', emailError);
      // Eliminar el token si falla el envío del correo
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', resetToken);
      
      return NextResponse.json(
        { error: 'Error al enviar el correo. Intenta más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Si el correo existe, se ha enviado un enlace de recuperación',
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

