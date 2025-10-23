import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken, createSession, cleanExpiredSessions } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrUsername, password } = body;

    // Validaciones básicas
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario por email o username
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .limit(1);

    if (queryError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Limpiar sesiones expiradas de todos los usuarios (mantenimiento)
    cleanExpiredSessions().catch(err => console.warn('Error limpiando sesiones expiradas:', err));

    // Eliminar sesiones antiguas del usuario actual
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('userId', user.id);

    if (deleteError) {
      console.warn('Advertencia al eliminar sesiones antiguas:', deleteError);
      // No lanzamos error, continuamos con el login
    }

    // Crear token y sesión nueva
    const token = createToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    await createSession(user.id, token);

    console.log('=== Login exitoso ===');
    console.log('Usuario:', user.username);
    console.log('Token generado (primeros 20 chars):', token.substring(0, 20) + '...');

    // Crear respuesta con cookie en el header
    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      username: user.username,
    });

    // Configuración de cookie optimizada para desarrollo local
    const cookieOptions = {
      httpOnly: true,
      secure: false, // false en desarrollo, true en producción
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      path: '/',
    };

    // En desarrollo, hacer la cookie menos restrictiva
    if (process.env.NODE_ENV !== 'production') {
      console.log('Modo desarrollo: Cookie con secure=false');
    }

    // Establecer cookie
    response.cookies.set('session_token', token, cookieOptions);

    // También establecer en el header Set-Cookie directamente como fallback
    const cookieString = `session_token=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    response.headers.append('Set-Cookie', cookieString);

    console.log('Cookie configurada en respuesta');
    console.log('Cookie string:', cookieString.substring(0, 100) + '...');

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

