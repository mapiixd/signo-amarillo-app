import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export const maxDuration = 60 // Para Vercel/Cloud Run
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { html, width = 1000, activeTab = 'main' } = body

    // Importación dinámica de puppeteer
    let browser
    let page
    
    try {
      // Intentar usar puppeteer para entornos de producción (Cloud Run, etc.)
      const puppeteer = await import('puppeteer')
      
      const launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--single-process',
          '--disable-web-security'
        ]
      }

      // En producción, puede que necesites especificar la ruta del ejecutable de Chrome
      if (process.env.CHROME_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.CHROME_EXECUTABLE_PATH
      }
      
      browser = await puppeteer.default.launch(launchOptions)
      
      page = await browser.newPage()
      
      // Configurar viewport con ancho fijo
      await page.setViewport({
        width: width,
        height: 1080, // Altura inicial, se ajustará
        deviceScaleFactor: 2 // Para mejor calidad
      })

      // Obtener información del deck
      const supabase = getSupabaseClient()
      const { data: deck, error } = await supabase
        .from('decks')
        .select(`
          *,
          deck_cards (
            quantity,
            is_sidedeck,
            card:cards (*)
          ),
          user:users (
            username
          )
        `)
        .eq('id', id)
        .single()

      if (error || !deck) {
        return NextResponse.json(
          { error: 'Deck no encontrado' },
          { status: 404 }
        )
      }

      // Filtrar cartas según el tab activo
      const cards = deck.deck_cards
        .filter((dc: any) => activeTab === 'main' ? !dc.is_sidedeck : dc.is_sidedeck)
        .sort((a: any, b: any) => {
          // Ordenar por tipo y nombre
          if (a.card.type !== b.card.type) {
            return a.card.type.localeCompare(b.card.type)
          }
          return a.card.name.localeCompare(b.card.name)
        })

      // Crear HTML completo para la exportación
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #0A0E1A;
              color: white;
              padding: 32px;
              width: ${width}px;
            }
            .header {
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 2px solid #2D9B96;
            }
            .title {
              color: #F4C430;
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 12px;
            }
            .meta {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              font-size: 16px;
              color: #A0A0A0;
            }
            .meta-label {
              color: #4ECDC4;
            }
            .meta-value {
              color: #F4C430;
              font-weight: 600;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 16px;
            }
            .card-container {
              position: relative;
            }
            .card {
              width: 100%;
              border-radius: 8px;
              overflow: hidden;
              border: 2px solid #2D9B96;
              position: relative;
            }
            .card img {
              width: 100%;
              height: auto;
              display: block;
            }
            .card-placeholder {
              width: 100%;
              aspect-ratio: 2.5 / 3.5;
              background: #1A2332;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #4ECDC4;
              font-size: 12px;
            }
            .quantity-badge {
              position: absolute;
              bottom: 4px;
              right: 8px;
              width: 48px;
              height: 48px;
              min-width: 48px;
              min-height: 48px;
              max-width: 48px;
              max-height: 48px;
              background: linear-gradient(to bottom right, #0A0E1A, #121825);
              border: 2px solid #F4C430;
              border-radius: 50% !important;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
              overflow: hidden;
            }
            .quantity-text {
              color: #F4C430;
              font-size: 20px;
              font-weight: bold;
              line-height: 1;
              display: inline-block;
              margin: 0;
              padding: 0;
              vertical-align: middle;
              text-align: center;
              transform: translateY(-10px);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${deck.name}</div>
            <div class="meta">
              ${deck.race ? `<span><span class="meta-label">Raza:</span> ${deck.race}</span>` : ''}
              <span><span class="meta-label">Formato:</span> ${deck.format || 'Imperio Racial'}</span>
              <span><span class="meta-label">Fecha:</span> ${new Date(deck.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              ${deck.user ? `<span><span class="meta-label">Creado por:</span> <span class="meta-value">${deck.user.username}</span></span>` : ''}
            </div>
          </div>
          <div class="grid">
            ${cards.map((entry: any) => {
              const imageUrl = entry.card.image_url 
                ? (entry.card.image_url.startsWith('http') 
                    ? entry.card.image_url 
                    : `https://storage.googleapis.com/decks-imperio-images${entry.card.image_url}`)
                : null
              
              return `
                <div class="card-container">
                  <div class="card">
                    ${imageUrl 
                      ? `<img src="${imageUrl}" alt="${entry.card.name}" />` 
                      : `<div class="card-placeholder">Sin imagen</div>`
                    }
                    <div class="quantity-badge">
                      <span class="quantity-text">${entry.quantity}</span>
                    </div>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </body>
        </html>
      `

      // Cargar el HTML
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // Esperar a que las imágenes se carguen
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Obtener la altura real del contenido
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight)

      // Ajustar el viewport a la altura real
      await page.setViewport({
        width: width,
        height: bodyHeight,
        deviceScaleFactor: 2
      })

      // Capturar screenshot
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 85,
        fullPage: true
      })

      await browser.close()

      // Convertir Uint8Array a Buffer para NextResponse
      const buffer = Buffer.from(screenshot)

      // Retornar la imagen
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${deck.name.replace(/[^a-z0-9]/gi, '_')}_${activeTab}.jpg"`
        }
      })

    } catch (puppeteerError) {
      console.error('Error con Puppeteer:', puppeteerError)
      
      // Fallback: si Puppeteer no está disponible, devolver HTML renderizable
      // El cliente intentará otro método
      const supabase = getSupabaseClient()
      const { data: deck } = await supabase
        .from('decks')
        .select(`
          *,
          deck_cards (
            quantity,
            is_sidedeck,
            card:cards (*)
          ),
          user:users (
            username
          )
        `)
        .eq('id', id)
        .single()

      return NextResponse.json(
        { 
          error: 'puppeteer_unavailable',
          message: 'Puppeteer no está disponible en este servidor. Usando método alternativo.',
          deck: deck,
          suggestion: 'client_fallback'
        },
        { status: 503 }
      )
    } finally {
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error('Error cerrando navegador:', closeError)
        }
      }
    }

  } catch (error) {
    console.error('Error en exportación server-side:', error)
    return NextResponse.json(
      { 
        error: 'Error al exportar la imagen',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

