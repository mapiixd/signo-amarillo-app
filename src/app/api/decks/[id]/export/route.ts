import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * La exportación de mazos como imagen se hace en el cliente con html2canvas.
 * Esta ruta ya no usa Puppeteer (eliminado para permitir hosting sin Chrome).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    {
      error: 'export_client_only',
      message: 'La exportación de imagen se realiza en el navegador. Usa el botón Exportar en la vista del mazo.'
    },
    { status: 410 }
  )
}
