import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { createToken, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { username, email, password } = body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
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

    // Verificar si el usuario ya existe
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'El correo ya está registrado' },
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'El nombre de usuario ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar ID único para el usuario (formato corto como yrUbiknctZipLFnD)
    const userId = nanoid();

    // Fecha actual para createdAt y updatedAt
    const now = new Date().toISOString();

    // Crear usuario
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username,
        email,
        password: hashedPassword,
        role: 'USER', // Por defecto es USER
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (insertError || !user) {
      throw insertError;
    }

    // Crear token y sesión
    const token = createToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    await createSession(user.id, token);

    // Establecer cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      username: user.username,
    }, { status: 201 });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}

