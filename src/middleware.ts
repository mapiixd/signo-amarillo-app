import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas
  const publicRoutes = ['/', '/cards', '/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/cards/'));

  // Rutas de administrador
  const isAdminRoute = pathname.startsWith('/admin');

  // Rutas de API de administrador
  const isAdminApiRoute = pathname.startsWith('/api/admin');

  // Rutas de API de autenticación (permitir siempre)
  const isAuthApiRoute = pathname.startsWith('/api/auth/');
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // Rutas de API públicas (cards, expansions, etc.)
  const isPublicApiRoute = pathname.startsWith('/api/cards') || pathname.startsWith('/api/expansions');
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Si es ruta pública, permitir acceso
  if (isPublicRoute && !isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  // Verificar autenticación
  if (!token) {
    // Si intenta acceder a admin o decks, redirigir a login
    if (isAdminRoute || pathname.startsWith('/decks')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // API devuelve 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
  }

  // Verificar token
  const payload = verifyToken(token!);
  if (!payload) {
    // Token inválido
    if (isAdminRoute || pathname.startsWith('/decks')) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      response.cookies.delete('session_token');
      return response;
    }
  }

  // Verificar si es admin para rutas de admin
  if ((isAdminRoute || isAdminApiRoute) && payload?.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

