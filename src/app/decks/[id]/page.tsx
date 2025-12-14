'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { DeckWithCards, Card as CardType, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'
import html2canvas from 'html2canvas'
import Swal from 'sweetalert2'

interface DeckWithLikes extends DeckWithCards {
  likes_count?: number
  is_liked?: boolean
  user?: {
    id: string
    username: string
  }
}

export default function DeckViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deck, setDeck] = useState<DeckWithLikes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (deck) {
      document.title = `${deck.name} | El Signo Amarillo`;
    } else {
      document.title = 'Ver Mazo | El Signo Amarillo';
    }
  }, [deck])
  const [activeTab, setActiveTab] = useState<'main' | 'sidedeck'>('main')
  const [exporting, setExporting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const deckViewRef = useRef<HTMLDivElement>(null)
  
  const fromCommunity = searchParams.get('from') === 'community'

  useEffect(() => {
    if (params.id) {
      fetchDeck(params.id as string)
    }
  }, [params.id, fromCommunity])

  useEffect(() => {
    if (deck && fromCommunity && deck.is_public) {
      checkLikeStatus()
    }
  }, [deck, fromCommunity])

  const fetchDeck = async (id: string) => {
    try {
      if (fromCommunity) {
        // Si viene de la comunidad, buscar en los mazos públicos
        const response = await fetch('/api/decks/community?limit=1000')
        if (response.ok) {
          const data = await response.json()
          const foundDeck = data.decks.find((d: DeckWithLikes) => d.id === id)
          if (foundDeck) {
            setDeck(foundDeck)
            setLikesCount(foundDeck.likes_count || 0)
            return
          }
        }
        // Si no se encuentra en la comunidad, intentar desde los mazos del usuario (por si es el dueño)
        const userResponse = await fetch('/api/decks')
        if (userResponse.ok) {
          const decks = await userResponse.json()
          const foundDeck = decks.find((d: DeckWithCards) => d.id === id)
          if (foundDeck) {
            setDeck(foundDeck)
            return
          }
        }
      } else {
        // Si no viene de la comunidad, buscar en los mazos del usuario
        const response = await fetch('/api/decks')
        if (response.ok) {
          const decks = await response.json()
          const foundDeck = decks.find((d: DeckWithCards) => d.id === id)
          if (foundDeck) {
            setDeck(foundDeck)
            return
          }
        }
        // Si no se encuentra en los mazos del usuario, intentar desde la comunidad (por si es público)
        const communityResponse = await fetch('/api/decks/community?limit=1000')
        if (communityResponse.ok) {
          const data = await communityResponse.json()
          const foundDeck = data.decks.find((d: DeckWithLikes) => d.id === id)
          if (foundDeck) {
            setDeck(foundDeck)
            setLikesCount(foundDeck.likes_count || 0)
            return
          }
        }
      }
    } catch (error) {
      console.error('Error fetching deck:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkLikeStatus = async () => {
    if (!deck) return
    try {
      const response = await fetch(`/api/decks/${deck.id}/like`)
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Error checking like status:', error)
    }
  }

  const handleLike = async () => {
    if (!deck) return
    
    try {
      const response = await fetch(`/api/decks/${deck.id}/like`, {
        method: 'POST'
      })

      if (response.status === 401) {
        Swal.fire({
          icon: 'info',
          title: 'Inicia sesión',
          text: 'Debes iniciar sesión para dar like a los mazos',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        return
      }

      if (response.ok) {
        const data = await response.json()
        const newLikedState = data.liked
        setIsLiked(newLikedState)
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo dar like al mazo',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4"></div>
          <p className="text-[#4ECDC4]">Cargando baraja...</p>
        </div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A0A0A0] text-lg mb-4">Baraja no encontrada</p>
          <button
            onClick={() => router.push(fromCommunity ? '/decks/community' : '/decks')}
            className="px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors"
          >
            {fromCommunity ? 'Volver a Mazos de la Comunidad' : 'Volver a Mis Barajas'}
          </button>
        </div>
      </div>
    )
  }

  const totalMainDeck = deck.cards.reduce((sum, entry) => sum + entry.quantity, 0)
  const totalSideboard = deck.sideboard.reduce((sum, entry) => sum + entry.quantity, 0)

  // Función helper para normalizar el coste
  // Para ALIADO, ARMA, TALISMAN, TOTEM: null o vacío = 0
  // Para ORO: mantener null
  const normalizeCost = (card: CardType): number => {
    if (card.type === 'ORO') {
      return card.cost ?? 999 // ORO sin coste va al final
    }
    // Para ALIADO, ARMA, TALISMAN, TOTEM: null o vacío = 0
    return card.cost ?? 0
  }

  // Función para ordenar cartas
  const sortCards = (cards: typeof deck.cards) => {
    // Orden de tipos: Aliado, Talismán, Arma, Totem, Oro
    const typeOrder: Record<string, number> = {
      'ALIADO': 1,
      'TALISMAN': 2,
      'ARMA': 3,
      'TOTEM': 4,
      'ORO': 5
    }

    return [...cards].sort((a, b) => {
      // 1. Primero por tipo (Aliado > Talismán > Arma > Totem > Oro)
      const typeA = typeOrder[a.card.type] || 999
      const typeB = typeOrder[b.card.type] || 999
      if (typeA !== typeB) return typeA - typeB

      // 2. Luego por coste (ascendente: 0, 1, 2, 3...)
      // Para ALIADO, ARMA, TALISMAN, TOTEM: null = 0
      // Para ORO: null va al final (999)
      const costA = normalizeCost(a.card)
      const costB = normalizeCost(b.card)
      if (costA !== costB) return costA - costB

      // 3. Luego por cantidad de copias (descendente: 3 > 2 > 1)
      if (a.quantity !== b.quantity) return b.quantity - a.quantity

      // 4. Finalmente por nombre alfabético
      return a.card.name.localeCompare(b.card.name, 'es', { sensitivity: 'base' })
    })
  }

  const cardsToDisplay = activeTab === 'main' 
    ? sortCards(deck.cards) 
    : sortCards(deck.sideboard)

  const handleExportImage = async () => {
    if (!deckViewRef.current || !deck) return
    
    setExporting(true)
    
    try {
      // Guardar estilos originales del contenedor de exportación
      const originalVisibility = deckViewRef.current.style.visibility
      const originalPosition = deckViewRef.current.style.position
      const originalLeft = deckViewRef.current.style.left
      const originalTop = deckViewRef.current.style.top
      const originalZIndex = deckViewRef.current.style.zIndex
      const originalWidth = deckViewRef.current.style.width
      const originalMaxWidth = deckViewRef.current.style.maxWidth
      const originalOpacity = deckViewRef.current.style.opacity
      const originalPointerEvents = deckViewRef.current.style.pointerEvents
      
      // Mover el contenedor fuera de la pantalla pero mantenerlo accesible para html2canvas
      // Usamos posición fuera de la pantalla pero sin ocultarlo completamente para que html2canvas pueda capturarlo
      // Ancho estándar para exportación consistente en todos los dispositivos
      const exportWidth = 1000 // Ancho estándar para exportación
      deckViewRef.current.style.position = 'absolute'
      deckViewRef.current.style.top = '0'
      deckViewRef.current.style.left = '-9999px'
      deckViewRef.current.style.width = `${exportWidth}px`
      deckViewRef.current.style.maxWidth = `${exportWidth}px`
      deckViewRef.current.style.minWidth = `${exportWidth}px`
      deckViewRef.current.style.visibility = 'visible' // Necesario para html2canvas
      deckViewRef.current.style.opacity = '1' // Necesario para html2canvas
      deckViewRef.current.style.pointerEvents = 'none' // Evitar interacciones
      deckViewRef.current.style.background = '#0A0E1A'
      deckViewRef.current.style.padding = '32px'
      deckViewRef.current.style.zIndex = '-9999' // Asegurar que esté detrás de todo
      
      // Esperar un momento para que el contenedor se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Función para reemplazar gradientes modernos con versiones compatibles
      const replaceModernGradients = (element: HTMLElement) => {
        const allElements = element.querySelectorAll('*')
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement
          
          // Reemplazar clases de gradiente con estilos inline compatibles
          if (htmlEl.className && typeof htmlEl.className === 'string') {
            if (htmlEl.className.includes('bg-gradient-to-br')) {
              htmlEl.style.background = 'linear-gradient(to bottom right, #0A0E1A, #121825)'
            } else if (htmlEl.className.includes('bg-gradient-to-r')) {
              htmlEl.style.background = 'linear-gradient(to right, #FF6B35, #2D9B96)'
            } else if (htmlEl.className.includes('bg-gradient-to-t')) {
              htmlEl.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5), transparent)'
            }
          }
        })
      }
      
      // Capturar el elemento como canvas con manejo de errores CSS
      const canvas = await html2canvas(deckViewRef.current, {
        backgroundColor: '#0A0E1A',
        scale: 2, // Escala 2 para mejor calidad en todos los dispositivos
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false, // Deshabilitar para evitar problemas con CSS moderno
        width: 1000, // Ancho fijo para consistencia
        height: deckViewRef.current.scrollHeight, // Altura automática basada en contenido
        onclone: (clonedDoc, element) => {
          try {
            // Ocultar botones de acción durante la exportación
            const actionButtons = element.querySelectorAll('button')
            actionButtons.forEach((btn) => {
              const htmlBtn = btn as HTMLElement
              if (htmlBtn.textContent?.includes('Exportar') || htmlBtn.textContent?.includes('Editar') || htmlBtn.textContent?.includes('Volver')) {
                htmlBtn.style.display = 'none'
              }
            })
            
            // Ocultar el Footer si existe
            const footer = element.querySelector('footer')
            if (footer) {
              footer.style.display = 'none'
            }
            
            // Reemplazar gradientes modernos en el documento clonado
            replaceModernGradients(element)
            
            // Buscar y reemplazar todos los elementos con funciones CSS modernas
            const allElements = clonedDoc.querySelectorAll('*')
            allElements.forEach((el) => {
              try {
                const htmlEl = el as HTMLElement
                
                // Obtener estilos computados puede fallar, usar try-catch
                let bgImage = ''
                try {
                  const computedStyle = clonedDoc.defaultView?.getComputedStyle(htmlEl)
                  bgImage = computedStyle?.backgroundImage || computedStyle?.background || ''
                } catch (e) {
                  // Si falla, continuar
                }
                
                // Si el background contiene funciones modernas, reemplazarlo
                if (bgImage && (bgImage.includes('oklab') || bgImage.includes('oklch'))) {
                  // Determinar el tipo de gradiente por clase
                  const classList = htmlEl.classList
                  if (classList.contains('bg-gradient-to-br')) {
                    htmlEl.style.backgroundImage = 'linear-gradient(to bottom right, #0A0E1A, #121825)'
                  } else if (classList.contains('bg-gradient-to-r')) {
                    htmlEl.style.backgroundImage = 'linear-gradient(to right, #FF6B35, #2D9B96)'
                  } else if (classList.contains('bg-gradient-to-t')) {
                    htmlEl.style.backgroundImage = 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5), transparent)'
                  } else {
                    // Fallback: usar color sólido
                    htmlEl.style.backgroundImage = 'none'
                    htmlEl.style.backgroundColor = '#121825'
                  }
                }
                
                // También reemplazar por clases directamente
                const className = htmlEl.className
                if (typeof className === 'string') {
                  if (className.includes('bg-gradient-to-br')) {
                    htmlEl.style.backgroundImage = 'linear-gradient(to bottom right, #0A0E1A, #121825)'
                  } else if (className.includes('bg-gradient-to-r')) {
                    htmlEl.style.backgroundImage = 'linear-gradient(to right, #FF6B35, #2D9B96)'
                  } else if (className.includes('bg-gradient-to-t')) {
                    htmlEl.style.backgroundImage = 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5), transparent)'
                  }
                }
                
                // Asegurar que los badges de cantidad tengan estilos correctos para exportación
                if (htmlEl.classList.contains('rounded-full') && htmlEl.style.display === 'flex') {
                  // Para exportación, posicionar el número arriba en lugar de centrado
                  htmlEl.style.display = 'flex'
                  htmlEl.style.alignItems = 'flex-start'
                  htmlEl.style.justifyContent = 'center'
                  htmlEl.style.paddingTop = '-10px'
                  const span = htmlEl.querySelector('span') as HTMLElement
                  if (span) {
                    // Posicionar el número más arriba
                    span.style.display = 'inline-block'
                    span.style.margin = '0'
                    span.style.padding = '0'
                    span.style.lineHeight = '1'
                    span.style.verticalAlign = 'top'
                  }
                }
                
                // Asegurar que las imágenes de fondo de las razas se vean correctamente
                if (htmlEl.tagName === 'IMG' && htmlEl.getAttribute('src')?.includes('/razas/')) {
                  htmlEl.style.opacity = '0.2'
                  htmlEl.style.objectFit = 'cover'
                }
                
                // Asegurar que las imágenes de las cartas se vean correctamente
                if (htmlEl.tagName === 'IMG' && htmlEl.getAttribute('src')?.includes('/cards/')) {
                  htmlEl.style.display = 'block'
                  htmlEl.style.width = '100%'
                  htmlEl.style.height = 'auto'
                  htmlEl.style.objectFit = 'cover'
                }
              } catch (e) {
                // Continuar con el siguiente elemento si hay error
                console.warn('Error procesando elemento para exportación:', e)
              }
            })
          } catch (e) {
            console.warn('Error en onclone:', e)
          }
        }
      })
      
      // Restaurar el estilo original del contenedor
      deckViewRef.current.style.visibility = originalVisibility || 'hidden'
      deckViewRef.current.style.position = originalPosition || 'absolute'
      deckViewRef.current.style.left = originalLeft || '-9999px'
      deckViewRef.current.style.top = originalTop || '0'
      deckViewRef.current.style.zIndex = originalZIndex || ''
      deckViewRef.current.style.width = originalWidth || ''
      deckViewRef.current.style.maxWidth = originalMaxWidth || ''
      deckViewRef.current.style.opacity = originalOpacity || ''
      deckViewRef.current.style.pointerEvents = originalPointerEvents || ''
      
      // Convertir a blob con compresión JPEG para reducir tamaño
      canvas.toBlob((blob) => {
        if (blob) {
          // Crear URL temporal
          const url = URL.createObjectURL(blob)
          
          // Crear link de descarga
          const link = document.createElement('a')
          link.download = `${deck.name.replace(/[^a-z0-9]/gi, '_')}_${activeTab}.jpg`
          link.href = url
          link.click()
          
          // Limpiar
          URL.revokeObjectURL(url)
        }
        setExporting(false)
      }, 'image/jpeg', 0.85) // JPEG con calidad 0.85 (85%) para reducir tamaño significativamente
    } catch (error) {
      console.error('Error al exportar imagen:', error)
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => fromCommunity ? router.push('/decks/community') : router.back()}
            className="text-[#2D9B96] hover:text-[#4ECDC4] mb-4 flex items-center gap-2 transition-colors"
          >
            ← Volver
          </button>
          
          <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden mb-6">
            {/* Header con imagen de fondo */}
            <div className="relative bg-[#1A2332] p-6 overflow-hidden min-h-[140px]">
              {/* Imagen de fondo grande */}
              {deck.race && (
                <img 
                  src={`/razas/${deck.race}.png`} 
                  alt={deck.race}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  style={deck.race === 'Sombra' ? { objectPosition: '50% 15%' } : undefined}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              
              {/* Contenido sobre la imagen */}
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-[#F4C430] mb-2 drop-shadow-lg">{deck.name}</h1>
                  
                  {deck.description && (
                    <p className="text-[#A0A0A0] mb-3 drop-shadow">{deck.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {deck.race && (
                      <span className="bg-[#0A0E1A] text-[#F4C430] px-3 py-1 rounded-full font-medium border border-[#2D9B96]">
                        {deck.race}
                      </span>
                    )}
                    <span className="text-[#4ECDC4] font-medium">
                      {deck.format || 'Imperio Racial'}
                    </span>
                    <span className="text-[#A0A0A0]">
                      Creada: {new Date(deck.created_at).toLocaleDateString('es-ES')}
                    </span>
                    {deck.is_public && (
                      <span className="text-[#4ECDC4]">🌐 Pública</span>
                    )}
                    {fromCommunity && (deck as DeckWithLikes).user && (
                      <span className="text-[#4ECDC4]">
                        por <span className="text-[#F4C430] font-semibold">{(deck as DeckWithLikes).user?.username}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleExportImage}
                    disabled={exporting}
                    className="px-5 py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? '📸 Exportando...' : '📸 Exportar Imagen'}
                  </button>
                  {fromCommunity && deck.is_public && (
                    <button
                      onClick={handleLike}
                      className={`px-5 py-2.5 rounded-lg transition-colors font-medium shadow-lg flex items-center gap-2 ${
                        isLiked
                          ? 'bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/30'
                          : 'bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] hover:bg-[#2D9B96] hover:text-white'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{likesCount}</span>
                    </button>
                  )}
                  {!fromCommunity && (
                    <button
                      onClick={() => router.push(`/decks/${deck.id}/edit`)}
                      className="px-5 py-2.5 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium shadow-lg"
                    >
                      Editar Baraja
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats y Tabs */}
          <div className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden">
            {/* Stats Row */}
            <div className="grid grid-cols-2 border-b border-[#2D9B96]">
              <div className="p-4 text-center border-r border-[#2D9B96]">
                <div className="text-3xl font-bold text-[#F4C430] mb-1">{totalMainDeck}</div>
                <div className="text-sm text-[#4ECDC4]">Cartas en Mazo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-3xl font-bold text-[#F4C430] mb-1">{totalSideboard}</div>
                <div className="text-sm text-[#4ECDC4]">Cartas en Sidedeck</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex">
              <button
                onClick={() => setActiveTab('main')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'main'
                    ? 'bg-[#2D9B96] text-white'
                    : 'bg-[#121825] text-[#A0A0A0] hover:text-[#4ECDC4]'
                }`}
              >
                Mazo Principal ({totalMainDeck})
              </button>
              <button
                onClick={() => setActiveTab('sidedeck')}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'sidedeck'
                    ? 'bg-[#2D9B96] text-white'
                    : 'bg-[#121825] text-[#A0A0A0] hover:text-[#4ECDC4]'
                }`}
              >
                Sidedeck ({totalSideboard})
              </button>
            </div>
          </div>
        </div>

        {/* Contenedor para exportación que incluye header y cartas - oculto visualmente pero accesible para html2canvas */}
        <div 
          ref={deckViewRef} 
          className="bg-[#0A0E1A] p-6 rounded-xl" 
          style={{ 
            visibility: 'hidden', 
            position: 'absolute', 
            left: '-9999px',
            top: '0',
            width: '1000px',
            maxWidth: '1000px',
            minWidth: '1000px'
          }}
        >
          {/* Header simple con solo texto para exportación */}
          <div className="mb-6 pb-4 border-b border-[#2D9B96]">
            <div className="text-[#F4C430] text-2xl font-bold mb-3">{deck.name}</div>
            <div className="flex flex-wrap items-center gap-4 text-base text-[#A0A0A0]">
              {deck.race && (
                <span><span className="text-[#4ECDC4]">Raza:</span> {deck.race}</span>
              )}
              <span><span className="text-[#4ECDC4]">Formato:</span> {deck.format || 'Imperio Racial'}</span>
              <span><span className="text-[#4ECDC4]">Fecha:</span> {new Date(deck.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              {fromCommunity && (deck as DeckWithLikes).user && (
                <span><span className="text-[#4ECDC4]">Creado por:</span> <span className="text-[#F4C430] font-semibold">{(deck as DeckWithLikes).user?.username}</span></span>
              )}
            </div>
          </div>

          {/* Grid de Cartas para exportación - Layout estándar consistente */}
          <div className="grid grid-cols-5 gap-4" style={{ width: '100%' }}>
          {cardsToDisplay.map((entry) => {
            // Verificar que la carta existe
            if (!entry.card) {
              console.error('Card not found for entry:', entry)
              return null
            }
            
            return (
              <div
                key={`export-${entry.card_id}`}
                className="relative"
              >
                {/* Carta */}
                <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-[#2D9B96]">
                  {(() => {
                    // Priorizar image_url si existe, sino usar image_file
                    const imagePath = entry.card.image_url || entry.card.image_file
                    const imageUrl = imagePath ? getCardImageUrl(imagePath, entry.card.expansion) : null
                    
                    if (!imageUrl) {
                      return (
                        <div className="w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]">
                          <span className="text-xs text-[#4ECDC4] text-center px-2">Sin imagen</span>
                        </div>
                      )
                    }
                    
                    return (
                      <img
                        src={imageUrl || ''}
                        alt={entry.card.name}
                        className="w-full h-auto object-cover"
                        style={{ display: 'block', width: '100%', height: 'auto', maxWidth: '100%' }}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent && !parent.querySelector('.image-error-placeholder')) {
                            const placeholder = document.createElement('div')
                            placeholder.className = 'image-error-placeholder w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]'
                            placeholder.innerHTML = '<span class="text-xs text-[#4ECDC4] text-center px-2">Error cargando imagen</span>'
                            parent.appendChild(placeholder)
                          }
                        }}
                      />
                    )
                  })()}
                  
                  {/* Badge de cantidad */}
                  <div 
                    className="absolute bottom-1 right-2 bg-gradient-to-br from-[#0A0E1A] to-[#121825] border-2 border-[#F4C430] rounded-full w-12 h-12 shadow-lg"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '0'
                    }}
                  >
                    <span 
                      className="text-xl font-bold text-[#F4C430]"
                      style={{
                        display: 'inline-block',
                        lineHeight: '1',
                        margin: '0',
                        padding: '0',
                        verticalAlign: 'middle'
                      }}
                    >
                      {entry.quantity}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          </div>

          {/* Mensaje si está vacío */}
          {cardsToDisplay.length === 0 && (
            <div className="text-center py-16 bg-[#0F1419] border border-[#2D9B96] rounded-xl">
              <div className="text-6xl mb-4">🎴</div>
              <p className="text-[#A0A0A0] text-lg">
                {activeTab === 'main' 
                  ? 'No hay cartas en el mazo principal' 
                  : 'No hay cartas en el sidedeck'}
              </p>
            </div>
          )}
        </div>

        {/* Grid de Cartas visible en la web */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {cardsToDisplay.map((entry) => {
            // Verificar que la carta existe
            if (!entry.card) {
              console.error('Card not found for entry:', entry)
              return null
            }
            
            return (
              <div
                key={entry.card_id}
                className="relative group"
              >
                {/* Carta */}
                <div className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-[#2D9B96] hover:border-[#4ECDC4]">
                  {(() => {
                    // Priorizar image_url si existe, sino usar image_file
                    const imagePath = entry.card.image_url || entry.card.image_file
                    const imageUrl = imagePath ? getCardImageUrl(imagePath, entry.card.expansion) : null
                    
                    if (!imageUrl) {
                      return (
                        <div className="w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]">
                          <span className="text-xs text-[#4ECDC4] text-center px-2">Sin imagen</span>
                        </div>
                      )
                    }
                    
                    return (
                      <img
                        src={imageUrl || ''}
                        alt={entry.card.name}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Ocultar imagen si falla y mostrar placeholder visual
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent && !parent.querySelector('.image-error-placeholder')) {
                            const placeholder = document.createElement('div')
                            placeholder.className = 'image-error-placeholder w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]'
                            placeholder.innerHTML = '<span class="text-xs text-[#4ECDC4] text-center px-2">Error cargando imagen</span>'
                            parent.appendChild(placeholder)
                          }
                        }}
                      />
                    )
                  })()}
                  
                  {/* Badge de cantidad */}
                  <div 
                    className="absolute bottom-1 right-2 bg-gradient-to-br from-[#0A0E1A] to-[#121825] border-2 border-[#F4C430] rounded-full w-12 h-12 shadow-lg"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '0'
                    }}
                  >
                    <span 
                      className="text-xl font-bold text-[#F4C430]"
                      style={{
                        display: 'inline-block',
                        lineHeight: '1',
                        margin: '0',
                        padding: '0',
                        verticalAlign: 'middle'
                      }}
                    >
                      {entry.quantity}
                    </span>
                  </div>

                  {/* Overlay con nombre en hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-3 w-full">
                      <p className="text-white font-bold text-sm line-clamp-2">
                        {entry.card.name}
                      </p>
                      <p className="text-[#4ECDC4] text-xs mt-1">
                        {CARD_TYPE_LABELS[entry.card.type as keyof typeof CARD_TYPE_LABELS] || entry.card.type} • {RARITY_TYPE_LABELS[entry.card.rarity as keyof typeof RARITY_TYPE_LABELS] || entry.card.rarity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mensaje si está vacío */}
        {cardsToDisplay.length === 0 && (
          <div className="text-center py-16 bg-[#0F1419] border border-[#2D9B96] rounded-xl">
            <div className="text-6xl mb-4">🎴</div>
            <p className="text-[#A0A0A0] text-lg">
              {activeTab === 'main' 
                ? 'No hay cartas en el mazo principal' 
                : 'No hay cartas en el sidedeck'}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

