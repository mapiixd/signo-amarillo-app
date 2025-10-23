import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Obtener cookies de la request
    const requestCookies = request.cookies.getAll();
    
    // Obtener cookies usando el helper de Next.js
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');
    
    console.log('=== Debug Cookies API ===');
    console.log('Request cookies:', requestCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    console.log('Session token from cookies():', sessionToken ? 'Found' : 'Not found');
    
    return NextResponse.json({
      requestCookies: requestCookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 50) + '...',
        present: true
      })),
      sessionTokenPresent: !!sessionToken,
      sessionTokenValue: sessionToken ? sessionToken.value.substring(0, 50) + '...' : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en debug cookies:', error);
    return NextResponse.json({ error: 'Error al obtener cookies' }, { status: 500 });
  }
}

