import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/auth/me llamado ===');
    
    // Verificar si hay cookies en la petición
    const cookies = request.cookies;
    const sessionToken = cookies.get('session_token');
    console.log('Cookie session_token presente:', !!sessionToken);
    if (sessionToken) {
      console.log('Token value (primeros 20 chars):', sessionToken.value.substring(0, 20) + '...');
    }

    const session = await getCurrentSession();
    console.log('Sesión obtenida:', !!session);

    if (!session) {
      console.log('No hay sesión válida, devolviendo 401');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('Usuario autenticado:', session.user.username);
    return NextResponse.json({
      user: session.user,
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

