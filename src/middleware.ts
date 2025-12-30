import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Forzar el uso de Node.js runtime en lugar de Edge runtime
export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Log para debugging - todas las rutas protegidas
  if (pathname.startsWith('/decks') || pathname.startsWith('/admin')) {
    console.log('=== Middleware - Ruta Protegida ===');
    console.log('Path:', pathname);
    console.log('Todas las cookies:', request.cookies.getAll().map(c => c.name).join(', '));
    console.log('Token session_token presente:', !!token);
    if (token) {
      console.log('Token (primeros 30 chars):', token.substring(0, 30) + '...');
    } else {
      console.log('⚠️ No se encontró cookie session_token en la request');
    }
  }

  // Rutas públicas
  const publicRoutes = ['/', '/cards', '/login', '/register', '/decks/community'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/cards/'));
  
  // Verificar si es una ruta de visualización de mazo individual (puede ser pública si el mazo es público)
  const isDeckViewRoute = /^\/decks\/[^\/]+$/.test(pathname) && pathname !== '/decks/community';

  // Rutas de administrador
  const isAdminRoute = pathname.startsWith('/admin');

  // Rutas de API de administrador
  const isAdminApiRoute = pathname.startsWith('/api/admin');

  // Rutas de API de autenticación (permitir siempre)
  const isAuthApiRoute = pathname.startsWith('/api/auth/');
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // Rutas de API públicas (cards, expansions, community decks, etc.)
  // /api/decks/[id] puede ser pública si el mazo es público, pero eso se verifica en la API
  const isPublicApiRoute = pathname.startsWith('/api/cards') || pathname.startsWith('/api/expansions') || pathname.startsWith('/api/decks/community');
  if (isPublicApiRoute) {
    return NextResponse.next();
  }
  
  // Permitir acceso a GET /api/decks/[id] sin autenticación (la API verificará si es público)
  if (pathname.match(/^\/api\/decks\/[^\/]+$/) && request.method === 'GET') {
    return NextResponse.next();
  }

  // Si es ruta pública o visualización de mazo, permitir acceso
  if ((isPublicRoute || isDeckViewRoute) && !isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  // Verificar autenticación
  if (!token) {
    console.log('Middleware: No hay token, redirigiendo a login');
    // Si intenta acceder a admin o decks (excepto community y visualización individual), redirigir a login
    if (isAdminRoute || (pathname.startsWith('/decks') && pathname !== '/decks/community' && !isDeckViewRoute)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // API devuelve 401 (excepto rutas públicas)
    if (pathname.startsWith('/api/') && !isPublicApiRoute && !pathname.match(/^\/api\/decks\/[^\/]+$/)) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
  }

  // Verificar token
  if (token) {
    const payload = verifyToken(token);
    console.log('Middleware: Token verificado, payload válido:', !!payload);
    if (!payload) {
      console.log('Middleware: Token inválido, eliminando cookie y redirigiendo');
      // Token inválido
      if (isAdminRoute || (pathname.startsWith('/decks') && pathname !== '/decks/community' && !isDeckViewRoute)) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session_token');
        return response;
      }
      if (pathname.startsWith('/api/') && !isPublicApiRoute && !pathname.match(/^\/api\/decks\/[^\/]+$/)) {
        const response = NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        response.cookies.delete('session_token');
        return response;
      }
    }
    
    // Verificar si es admin para rutas de admin
    if ((isAdminRoute || isAdminApiRoute) && payload?.role !== 'ADMIN') {
      console.log('Middleware: Usuario no es admin');
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    console.log('Middleware: Todo OK, permitiendo acceso');
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

