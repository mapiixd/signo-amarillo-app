import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface UserPayload {
  userId: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

/**
 * Crear cliente de Supabase
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createClient(supabaseUrl, supabaseKey);
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
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    console.log('verifyToken: Token verificado exitosamente para usuario:', decoded.username);
    return decoded;
  } catch (error: any) {
    console.error('verifyToken: Error verificando token:', error.message);
    if (error.name === 'TokenExpiredError') {
      console.error('verifyToken: Token expirado en:', error.expiredAt);
    }
    return null;
  }
}

/**
 * Crear sesión en la base de datos
 */
export async function createSession(userId: string, token: string) {
  const supabase = getSupabaseClient();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const sessionId = randomUUID();
  
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      userId: userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
  const supabase = getSupabaseClient();
  
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      users (*)
    `)
    .eq('token', token)
    .single();

  console.log('getCurrentSession: Sesión encontrada en BD:', !!session);
  if (error || !session) {
    console.log('getCurrentSession: Error o sesión no encontrada:', error);
    return null;
  }

  const expiresAt = new Date(session.expiresAt);
  console.log('getCurrentSession: Sesión expira en:', expiresAt);
  console.log('getCurrentSession: Fecha actual:', new Date());
  console.log('getCurrentSession: Sesión expirada:', expiresAt < new Date());

  if (expiresAt < new Date()) {
    // Sesión expirada
    console.log('getCurrentSession: Sesión expirada, eliminando...');
    await supabase.from('sessions').delete().eq('id', session.id);
    return null;
  }

  const user = Array.isArray(session.users) ? session.users[0] : session.users;
  
  console.log('getCurrentSession: Sesión válida, retornando usuario:', user.username);
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    session,
  };
}

/**
 * Eliminar sesión (logout)
 */
export async function deleteSession(token: string) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('sessions').delete().eq('token', token);
  } catch (error) {
    // Sesión no encontrada, ignorar
  }
}

/**
 * Limpiar sesiones expiradas de la base de datos
 * Esta función puede ser llamada periódicamente para mantener la BD limpia
 */
export async function cleanExpiredSessions() {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('expiresAt', now);
    
    if (error) {
      console.error('Error limpiando sesiones expiradas:', error);
    } else {
      console.log('Sesiones expiradas limpiadas exitosamente');
    }
  } catch (error) {
    console.error('Error en cleanExpiredSessions:', error);
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

