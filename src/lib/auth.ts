import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface UserPayload {
  userId: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

/**
 * Hash de contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verificar contraseña
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Crear token JWT
 */
export function createToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verificar token JWT
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Crear sesión en la base de datos
 */
export async function createSession(userId: string, token: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  return prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * Obtener sesión actual del usuario
 */
export async function getCurrentSession() {
  console.log('getCurrentSession: Iniciando...');
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  
  console.log('getCurrentSession: Token presente:', !!token);
  if (!token) {
    console.log('getCurrentSession: No hay token, retornando null');
    return null;
  }

  const payload = verifyToken(token);
  console.log('getCurrentSession: Token válido:', !!payload);
  if (!payload) {
    console.log('getCurrentSession: Token inválido, retornando null');
    return null;
  }

  // Verificar si la sesión existe en la BD y no ha expirado
  console.log('getCurrentSession: Buscando sesión en BD...');
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  console.log('getCurrentSession: Sesión encontrada en BD:', !!session);
  if (session) {
    console.log('getCurrentSession: Sesión expira en:', session.expiresAt);
    console.log('getCurrentSession: Fecha actual:', new Date());
    console.log('getCurrentSession: Sesión expirada:', session.expiresAt < new Date());
  }

  if (!session || session.expiresAt < new Date()) {
    // Sesión expirada o inválida
    console.log('getCurrentSession: Sesión inválida o expirada');
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  console.log('getCurrentSession: Sesión válida, retornando usuario:', session.user.username);
  return {
    user: {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      role: session.user.role,
    },
    session,
  };
}

/**
 * Eliminar sesión (logout)
 */
export async function deleteSession(token: string) {
  try {
    await prisma.session.delete({ where: { token } });
  } catch (error) {
    // Sesión no encontrada, ignorar
  }
}

/**
 * Validar que el usuario sea administrador
 */
export async function requireAdmin() {
  const session = await getCurrentSession();
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }
  
  return session.user;
}

/**
 * Validar que el usuario esté autenticado
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  
  if (!session) {
    throw new Error('No autenticado');
  }
  
  return session.user;
}

