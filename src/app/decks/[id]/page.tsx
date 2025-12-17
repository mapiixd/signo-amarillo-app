'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { DeckWithCards, Card as CardType, CARD_TYPE_LABELS, RARITY_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'
import Footer from '@/components/Footer'
import html2canvas from 'html2canvas'
import Swal from 'sweetalert2'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
  const [exportOrientation, setExportOrientation] = useState<'vertical' | 'horizontal'>('vertical')
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const deckViewRef = useRef<HTMLDivElement>(null)
  const [showHandTestModal, setShowHandTestModal] = useState(false)
  const [currentHand, setCurrentHand] = useState<(CardType & { quantity: number })[]>([])
  const [handSize, setHandSize] = useState(8)
  const [excludedInitialGold, setExcludedInitialGold] = useState<string | null>(null)
  const [selectedCardForView, setSelectedCardForView] = useState<CardType | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
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

  // Función para preparar datos del gráfico de curva de costes
  const prepareChartData = useMemo(() => {
    if (!deck) return []

    // Obtener cartas del mazo principal (no sidedeck) y excluir ORO
    const cardsForChart = deck.cards.filter(entry => entry.card.type !== 'ORO')
    
    // Encontrar el coste máximo
    const maxCost = Math.max(
      ...cardsForChart.map(entry => entry.card.cost ?? 0),
      0
    )

    // Crear estructura de datos por coste
    const chartData: Array<{
      coste: string
      Aliado: number
      Arma: number
      Totem: number
      Talismán: number
    }> = []

    // Inicializar todos los costes desde 0 hasta maxCost
    for (let cost = 0; cost <= maxCost; cost++) {
      chartData.push({
        coste: cost.toString(),
        Aliado: 0,
        Arma: 0,
        Totem: 0,
        Talismán: 0
      })
    }

    // Agrupar cartas por coste y tipo
    cardsForChart.forEach(entry => {
      const cost = entry.card.cost ?? 0
      const type = entry.card.type
      const quantity = entry.quantity

      const dataPoint = chartData[cost]
      if (dataPoint) {
        switch (type) {
          case 'ALIADO':
            dataPoint.Aliado += quantity
            break
          case 'ARMA':
            dataPoint.Arma += quantity
            break
          case 'TOTEM':
            dataPoint.Totem += quantity
            break
          case 'TALISMAN':
            dataPoint.Talismán += quantity
            break
        }
      }
    })

    // Filtrar costes que no tienen cartas (opcional, o dejarlos en 0)
    return chartData
  }, [deck])

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

  // Función para agrupar cartas por tipo para la vista de tabla
  const groupCardsByType = (cards: typeof deck.cards) => {
    const grouped: Record<string, typeof deck.cards> = {
      'ALIADO': [],
      'ARMA': [],
      'TOTEM': [],
      'TALISMAN': [],
      'ORO': []
    }

    cards.forEach(entry => {
      const type = entry.card.type
      if (grouped[type]) {
        grouped[type].push(entry)
      }
    })

    // Ordenar cada grupo por coste y luego por nombre
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => {
        const costA = normalizeCost(a.card)
        const costB = normalizeCost(b.card)
        if (costA !== costB) return costA - costB
        return a.card.name.localeCompare(b.card.name, 'es', { sensitivity: 'base' })
      })
    })

    return grouped
  }

  const cardsByType = groupCardsByType(cardsToDisplay)

  // Función para obtener los oros iniciales del mazo
  const getInitialGolds = () => {
    if (!deck) return []
    return deck.cards
      .filter(entry => 
        entry.card.type === 'ORO' && 
        entry.card.description && 
        entry.card.description.startsWith('Oro Inicial.')
      )
      .map(entry => entry.card)
  }

  // Función para generar una mano aleatoria
  const generateRandomHand = (size: number = 8) => {
    if (!deck || deck.cards.length === 0) return []

    // Crear un pool de cartas considerando las cantidades
    const cardPool: (CardType & { quantity: number })[] = []
    deck.cards.forEach(entry => {
      // Excluir el oro inicial seleccionado si existe
      if (excludedInitialGold && entry.card.id === excludedInitialGold) {
        return
      }
      
      for (let i = 0; i < entry.quantity; i++) {
        cardPool.push({ ...entry.card, quantity: 1 })
      }
    })

    // Si el pool es menor que el tamaño solicitado, usar todas las cartas disponibles
    if (cardPool.length < size) {
      return cardPool
    }

    // Seleccionar cartas aleatorias sin repetición
    const shuffled = [...cardPool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, size)
  }

  // Función para abrir el modal de probar manos
  const handleOpenHandTest = () => {
    const initialGolds = getInitialGolds()
    // Si hay un solo oro inicial, excluirlo automáticamente
    if (initialGolds.length === 1) {
      setExcludedInitialGold(initialGolds[0].id)
    } else if (initialGolds.length > 1) {
      // Si hay múltiples, seleccionar el primero por defecto si no hay uno ya seleccionado
      if (!excludedInitialGold || !initialGolds.find(g => g.id === excludedInitialGold)) {
        setExcludedInitialGold(initialGolds[0].id)
      }
    }
    
    const newHand = generateRandomHand(8)
    setCurrentHand(newHand)
    setHandSize(8)
    setShowHandTestModal(true)
  }

  // Función para probar otra mano
  const handleNewHand = () => {
    const newHand = generateRandomHand(8)
    setCurrentHand(newHand)
    setHandSize(8)
  }

  // Función para hacer mulligan
  const handleMulligan = () => {
    if (handSize > 1) {
      const newSize = handSize - 1
      const newHand = generateRandomHand(newSize)
      setCurrentHand(newHand)
      setHandSize(newSize)
    }
  }

  // Función para manejar el cambio de oro excluido
  const handleExcludedGoldChange = (goldId: string) => {
    setExcludedInitialGold(goldId)
    // Regenerar la mano con el nuevo oro excluido
    const newHand = generateRandomHand(handSize)
    setCurrentHand(newHand)
  }

  const handleExportImage = async () => {
    if (!deck) return
    
    setExporting(true)
    
    try {
      // Detectar Safari en iOS
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      
      // Si es Safari o iOS, usar exportación server-side primero
      if (isSafari || isIOS) {
        try {
          const response = await fetch(`/api/decks/${params.id}/export`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              activeTab: activeTab,
              width: exportOrientation === 'horizontal' ? 1800 : 1000,
              orientation: exportOrientation
            })
          })
          
          if (response.ok) {
            // Descargar la imagen
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.download = `${deck.name.replace(/[^a-z0-9]/gi, '_')}_${activeTab}.jpg`
            link.href = url
            link.click()
            URL.revokeObjectURL(url)
            
            setExporting(false)
            return
          }
          
          // Si falla el servidor, intentar método alternativo optimizado para Safari/iOS
          console.warn('Servidor no disponible, usando método alternativo para Safari/iOS')
          
        } catch (serverError) {
          console.error('Error en exportación server-side:', serverError)
        }
        
        // Método alternativo para Safari/iOS: exportar con dimensiones reducidas
        if (!deckViewRef.current) {
          setExporting(false)
          return
        }
        
        try {
          // Configurar el contenedor con dimensiones más pequeñas para Safari/iOS
          const exportWidth = exportOrientation === 'horizontal' ? 1440 : 800 // Reducir ancho para Safari/iOS
          deckViewRef.current.style.position = 'absolute'
          deckViewRef.current.style.top = '0'
          deckViewRef.current.style.left = '-9999px'
          deckViewRef.current.style.width = `${exportWidth}px`
          deckViewRef.current.style.maxWidth = `${exportWidth}px`
          deckViewRef.current.style.minWidth = `${exportWidth}px`
          deckViewRef.current.style.visibility = 'visible'
          deckViewRef.current.style.opacity = '1'
          deckViewRef.current.style.background = '#0A0E1A'
          deckViewRef.current.style.padding = '24px'
          
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Capturar con html2canvas usando configuración optimizada para Safari/iOS
          const canvas = await html2canvas(deckViewRef.current, {
            backgroundColor: '#0A0E1A',
            scale: 1.5, // Reducir escala para Safari/iOS
            logging: false,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            width: exportWidth, // Ancho según orientación
            windowHeight: deckViewRef.current.scrollHeight,
            onclone: (clonedDoc, element) => {
              // Ocultar botones y footer
              const actionButtons = element.querySelectorAll('button')
              actionButtons.forEach((btn) => {
                const htmlBtn = btn as HTMLElement
                htmlBtn.style.display = 'none'
              })
              const footer = element.querySelector('footer')
              if (footer) footer.style.display = 'none'
              
              // Asegurar que los badges de cantidad sean perfectamente circulares en Safari/iOS
              const badges = element.querySelectorAll('.rounded-full')
              badges.forEach((badge) => {
                const htmlBadge = badge as HTMLElement
                if (htmlBadge.classList.contains('w-12') && htmlBadge.classList.contains('h-12')) {
                  htmlBadge.style.borderRadius = '50%'
                  htmlBadge.style.width = '48px'
                  htmlBadge.style.height = '48px'
                  htmlBadge.style.minWidth = '48px'
                  htmlBadge.style.minHeight = '48px'
                  htmlBadge.style.overflow = 'hidden'
                  htmlBadge.style.display = 'flex'
                  htmlBadge.style.alignItems = 'center'
                  htmlBadge.style.justifyContent = 'center'
                  // Ajustar posición del número dentro del badge
                  const span = htmlBadge.querySelector('span') as HTMLElement
                  if (span) {
                    span.style.transform = 'translateY(-10px)'
                  }
                }
              })
            }
          })
          
          // Restaurar estilos
          deckViewRef.current.style.visibility = 'hidden'
          deckViewRef.current.style.position = 'absolute'
          deckViewRef.current.style.left = '-9999px'
          
          // Convertir a blob con mayor compresión para reducir tamaño
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.download = `${deck.name.replace(/[^a-z0-9]/gi, '_')}_${activeTab}.jpg`
              link.href = url
              link.click()
              URL.revokeObjectURL(url)
            }
            setExporting(false)
          }, 'image/jpeg', 0.80)
          
          return
        } catch (safariError) {
          console.error('Error en método alternativo Safari/iOS:', safariError)
          setExporting(false)
          alert('Error al exportar la imagen en Safari/iOS. Por favor, intenta desde un navegador de escritorio.')
          return
        }
      }
      
      // Método cliente (html2canvas) para navegadores de escritorio
      if (!deckViewRef.current) return
      
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
      // Ancho según orientación seleccionada
      const exportWidth = exportOrientation === 'horizontal' ? 1800 : 1000
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
        width: exportWidth, // Ancho según orientación
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
                
                // Asegurar que los badges de cantidad sean perfectamente circulares
                if (htmlEl.classList.contains('rounded-full') && htmlEl.classList.contains('w-12') && htmlEl.classList.contains('h-12')) {
                  htmlEl.style.borderRadius = '50%'
                  htmlEl.style.width = '48px'
                  htmlEl.style.height = '48px'
                  htmlEl.style.minWidth = '48px'
                  htmlEl.style.minHeight = '48px'
                  htmlEl.style.overflow = 'hidden'
                  htmlEl.style.display = 'flex'
                  htmlEl.style.alignItems = 'center'
                  htmlEl.style.justifyContent = 'center'
                  const span = htmlEl.querySelector('span') as HTMLElement
                  if (span) {
                    span.style.display = 'inline-block'
                    span.style.margin = '0'
                    span.style.padding = '0'
                    span.style.lineHeight = '1'
                    span.style.verticalAlign = 'middle'
                    span.style.transform = 'translateY(-10px)'
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
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#F4C430] mb-2 drop-shadow-lg break-words">{deck.name}</h1>
                  
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

                <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
                  <button
                    onClick={handleOpenHandTest}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg text-sm sm:text-base whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">🎴 Probar Mano</span>
                    <span className="sm:hidden">🎴 Mano</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <select
                      value={exportOrientation}
                      onChange={(e) => setExportOrientation(e.target.value as 'vertical' | 'horizontal')}
                      className="px-2 py-2 sm:px-4 sm:py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg focus:outline-none focus:border-[#4ECDC4] transition-colors font-medium shadow-lg appearance-none cursor-pointer text-sm sm:text-base"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234ECDC4' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        paddingRight: '1.75rem'
                      }}
                    >
                      <option value="vertical">📱 Vertical</option>
                      <option value="horizontal">🖥️ Horizontal</option>
                    </select>
                    <button
                      onClick={handleExportImage}
                      disabled={exporting}
                      className="px-3 py-2 sm:px-5 sm:py-2.5 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                    >
                      {exporting ? (
                        <>
                          <span className="hidden sm:inline">📸 Exportando...</span>
                          <span className="sm:hidden">📸...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">📸 Exportar Imagen</span>
                          <span className="sm:hidden">📸 Exportar</span>
                        </>
                      )}
                    </button>
                  </div>
                  {fromCommunity && deck.is_public && (
                    <button
                      onClick={handleLike}
                      className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors font-medium shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                        isLiked
                          ? 'bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600/30'
                          : 'bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] hover:bg-[#2D9B96] hover:text-white'
                      }`}
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
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
                      className="px-3 py-2 sm:px-5 sm:py-2.5 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium shadow-lg text-sm sm:text-base whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Editar Baraja</span>
                      <span className="sm:hidden">Editar</span>
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

          {/* Selector de modo de visualización */}
          <div className="mt-4 flex justify-end">
            <div className="flex gap-2 bg-[#0F1419] border border-[#2D9B96] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#2D9B96] text-white'
                    : 'text-[#A0A0A0] hover:text-[#4ECDC4]'
                }`}
                title="Vista de grid"
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#2D9B96] text-white'
                    : 'text-[#A0A0A0] hover:text-[#4ECDC4]'
                }`}
                title="Vista de tabla"
              >
                <i className="fas fa-bars"></i>
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
            width: exportOrientation === 'horizontal' ? '1800px' : '1000px',
            maxWidth: exportOrientation === 'horizontal' ? '1800px' : '1000px',
            minWidth: exportOrientation === 'horizontal' ? '1800px' : '1000px'
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

          {/* Grid de Cartas para exportación - Layout según orientación */}
          <div className={`grid gap-4`} style={{ 
            width: '100%',
            gridTemplateColumns: exportOrientation === 'horizontal' ? 'repeat(9, 1fr)' : 'repeat(5, 1fr)'
          }}>
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
                      lineHeight: '0',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      minHeight: '48px',
                      overflow: 'hidden'
                    }}
                  >
                    <span 
                      className="text-xl font-bold text-[#F4C430]"
                      style={{
                        display: 'inline-block',
                        lineHeight: '1',
                        margin: '0',
                        padding: '0',
                        verticalAlign: 'middle',
                        transform: 'translateY(-2px)'
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

        {/* Vista Grid o Tabla */}
        {viewMode === 'grid' ? (
          <>
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
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedCardForView(entry.card)}
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
          </>
        ) : (
          <>
            {/* Vista de Tabla */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(['ALIADO', 'ARMA', 'TOTEM', 'TALISMAN', 'ORO'] as const).map((type) => {
                const cards = cardsByType[type]
                if (cards.length === 0) return null

                const typeLabel = CARD_TYPE_LABELS[type] || type
                const totalQuantity = cards.reduce((sum, entry) => sum + entry.quantity, 0)
                const isOro = type === 'ORO'

                return (
                  <div key={type} className="bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-hidden">
                    {/* Header de la tabla por tipo */}
                    <div className="bg-[#1A2332] border-b border-[#2D9B96] px-3 py-2">
                      <h3 className="text-base font-bold text-[#F4C430]">
                        {typeLabel} ({totalQuantity})
                      </h3>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#121825] border-b border-[#2D9B96]">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#4ECDC4]">Cantidad</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[#4ECDC4]">Nombre</th>
                            {!isOro && (
                              <th className="px-3 py-2 text-left text-xs font-semibold text-[#4ECDC4]">Coste</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {cards.map((entry) => {
                            if (!entry.card) return null

                            return (
                              <tr
                                key={entry.card_id}
                                className="border-b border-[#2D9B96]/50 hover:bg-[#1A2332]/50 cursor-pointer transition-colors"
                                onClick={() => setSelectedCardForView(entry.card)}
                              >
                                <td className="px-3 py-2 text-[#F4C430] font-semibold text-sm">
                                  {entry.quantity}
                                </td>
                                <td className="px-3 py-2 text-white text-sm">
                                  {entry.card.name}
                                </td>
                                {!isOro && (
                                  <td className="px-3 py-2 text-[#4ECDC4] text-sm">
                                    {entry.card.cost !== null ? entry.card.cost : '-'}
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
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
          </>
        )}

        {/* Gráfico de curva de costes */}
        {activeTab === 'main' && prepareChartData.length > 0 && (
          <div className="mt-6 bg-[#0F1419] border border-[#2D9B96] rounded-xl overflow-visible p-3 sm:p-4 md:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#F4C430] mb-3 sm:mb-4">Curva de Costes</h3>
            <div className="w-full overflow-visible" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={prepareChartData}
                  margin={{ 
                    top: 10, 
                    right: 10, 
                    left: 0, 
                    bottom: 40 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D9B96" opacity={0.3} />
                  <XAxis 
                    dataKey="coste" 
                    stroke="#4ECDC4"
                    tick={{ fill: '#4ECDC4', fontSize: 12 }}
                    label={{ 
                      value: 'Coste', 
                      position: 'insideBottom', 
                      offset: 0, 
                      fill: '#4ECDC4',
                      style: { fontSize: '12px' }
                    }}
                  />
                  <YAxis 
                    stroke="#4ECDC4"
                    tick={{ fill: '#4ECDC4', fontSize: 12 }}
                    label={{ 
                      value: 'Cantidad', 
                      angle: -90, 
                      position: 'insideLeft', 
                      fill: '#4ECDC4',
                      style: { fontSize: '12px' }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1419',
                      border: '1px solid #2D9B96',
                      borderRadius: '8px',
                      color: '#F4C430',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: '#4ECDC4', fontSize: '12px' }}
                    labelStyle={{ color: '#F4C430', fontWeight: 'bold', fontSize: '12px' }}
                    position={{ x: 0, y: 200 }}
                    allowEscapeViewBox={{ x: true, y: true }}
                    offset={10}
                  />
                  <Legend
                    wrapperStyle={{ color: '#4ECDC4', fontSize: '12px', paddingTop: '10px' }}
                    iconSize={12}
                    verticalAlign="top"
                    align="center"
                  />
                  <Bar dataKey="Aliado" stackId="a" fill="#2D9B96" />
                  <Bar dataKey="Arma" stackId="a" fill="#B8384E" />
                  <Bar dataKey="Totem" stackId="a" fill="#1A7F5A" />
                  <Bar dataKey="Talismán" stackId="a" fill="#8B4789" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Probar Manos */}
      {showHandTestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1419] border-2 border-[#2D9B96] rounded-xl max-w-6xl w-full">
            {/* Header del Modal */}
            <div className="bg-[#0F1419] border-b border-[#2D9B96] px-4 py-3 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#F4C430]">
                Probar Mano ({currentHand.length} cartas)
              </h2>
              <button
                onClick={() => setShowHandTestModal(false)}
                className="text-[#4ECDC4] hover:text-white transition-colors text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4">
              {/* Grid de Cartas */}
              {currentHand.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
                  {currentHand.map((card, index) => {
                    const imagePath = card.image_url || card.image_file
                    const imageUrl = imagePath ? getCardImageUrl(imagePath, card.expansion) : null

                    return (
                      <div
                        key={`hand-${card.id}-${index}`}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedCardForView(card)}
                      >
                        <div className="relative rounded overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:scale-110 border border-[#2D9B96] hover:border-[#4ECDC4]">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={card.name}
                              className="w-full h-auto object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const parent = e.currentTarget.parentElement
                                if (parent && !parent.querySelector('.image-error-placeholder')) {
                                  const placeholder = document.createElement('div')
                                  placeholder.className = 'image-error-placeholder w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]'
                                  placeholder.innerHTML = '<span class="text-[8px] text-[#4ECDC4] text-center px-1">Sin imagen</span>'
                                  parent.appendChild(placeholder)
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full aspect-[2.5/3.5] bg-[#1A2332] flex items-center justify-center border border-[#2D9B96]">
                              <span className="text-[8px] text-[#4ECDC4] text-center px-1">Sin imagen</span>
                            </div>
                          )}

                          {/* Overlay con nombre en hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-1.5 w-full">
                              <p className="text-white font-bold text-[10px] leading-tight line-clamp-2">
                                {card.name}
                              </p>
                              <p className="text-[#4ECDC4] text-[8px] mt-0.5">
                                {CARD_TYPE_LABELS[card.type as keyof typeof CARD_TYPE_LABELS] || card.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#0F1419] border border-[#2D9B96] rounded-xl mb-4">
                  <div className="text-4xl mb-2">🎴</div>
                  <p className="text-[#A0A0A0] text-sm">
                    No hay suficientes cartas en el mazo para generar una mano
                  </p>
                </div>
              )}

              {/* Selector de Oro Inicial a Excluir */}
              {(() => {
                const initialGolds = getInitialGolds()
                if (initialGolds.length > 1) {
                  // Asegurar que siempre haya un oro seleccionado (usar el primero si no hay ninguno)
                  const selectedGold = excludedInitialGold || initialGolds[0].id
                  
                  return (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#4ECDC4] mb-2">
                        Oro Inicial a excluir del mulligan:
                      </label>
                      <select
                        value={selectedGold}
                        onChange={(e) => handleExcludedGoldChange(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A2332] border border-[#2D9B96] rounded-lg text-[#F4C430] focus:outline-none focus:border-[#4ECDC4] text-sm"
                      >
                        {initialGolds.map((gold) => (
                          <option key={gold.id} value={gold.id}>
                            {gold.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                } else if (initialGolds.length === 1 && excludedInitialGold) {
                  return (
                    <div className="mb-4 p-3 bg-[#1A2332] border border-[#2D9B96] rounded-lg">
                      <p className="text-xs text-[#4ECDC4]">
                        ℹ️ El oro inicial <span className="text-[#F4C430] font-semibold">{initialGolds[0].name}</span> está excluido automáticamente del mulligan.
                      </p>
                    </div>
                  )
                }
                return null
              })()}

              {/* Botones de Acción */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={handleNewHand}
                  className="px-4 py-2 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-colors font-medium shadow-lg text-sm"
                >
                  🎲 Probar Otra Mano
                </button>
                <button
                  onClick={handleMulligan}
                  disabled={handSize <= 1}
                  className="px-4 py-2 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {handSize > 1 ? `🔄 Mulligan a ${handSize - 1}` : '🔄 Mulligan (mínimo)'}
                </button>
                <button
                  onClick={() => setShowHandTestModal(false)}
                  className="px-4 py-2 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de la carta */}
      {selectedCardForView && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCardForView(null)}
        >
          <div 
            className="bg-[#121825] border-2 border-[#2D9B96] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="sticky top-0 bg-[#121825] border-b border-[#2D9B96] p-3 sm:p-4 flex justify-between items-center gap-2 z-10">
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-[#F4C430] truncate flex-1 min-w-0">
                {selectedCardForView.name}
              </h2>
              <button
                onClick={() => setSelectedCardForView(null)}
                className="text-[#4ECDC4] hover:text-[#F4C430] text-xl sm:text-2xl font-bold w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-[#1A2332] transition-colors flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-4 sm:p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Imagen de la carta */}
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    {(() => {
                      const imagePath = selectedCardForView.image_url || selectedCardForView.image_file
                      const imageUrl = imagePath ? getCardImageUrl(imagePath, selectedCardForView.expansion) : null
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={selectedCardForView.name}
                          className="w-full h-auto rounded-lg border-2 border-[#2D9B96] shadow-lg"
                        />
                      ) : (
                        <div className="aspect-[3/4] bg-[#1A2332] rounded-lg border-2 border-[#2D9B96] flex items-center justify-center">
                          <span className="text-[#4ECDC4]">Sin imagen</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Información de la carta */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Tipo</label>
                    <span className="inline-block px-3 py-1 rounded-lg bg-[#2D9B96] text-white text-sm">
                      {CARD_TYPE_LABELS[selectedCardForView.type as keyof typeof CARD_TYPE_LABELS] || selectedCardForView.type}
                    </span>
                  </div>

                  {selectedCardForView.cost !== null && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Coste</label>
                      <div className="text-2xl font-bold text-[#F4C430]">{selectedCardForView.cost}</div>
                    </div>
                  )}

                  {selectedCardForView.attack !== null && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Fuerza</label>
                      <div className="text-2xl font-bold text-[#E74860]">{selectedCardForView.attack}</div>
                    </div>
                  )}

                  {selectedCardForView.defense !== null && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Defensa</label>
                      <div className="text-2xl font-bold text-[#4ECDC4]">{selectedCardForView.defense}</div>
                    </div>
                  )}

                  {selectedCardForView.race && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Raza</label>
                      <div className="text-lg text-[#E8E8E8]">{selectedCardForView.race}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Expansión</label>
                    <div className="text-sm text-[#E8E8E8]">{selectedCardForView.expansion}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Rareza</label>
                    <span className="inline-block px-3 py-1 rounded-lg bg-[#2D9B96] text-white text-sm">
                      {RARITY_TYPE_LABELS[selectedCardForView.rarity as keyof typeof RARITY_TYPE_LABELS] || selectedCardForView.rarity}
                    </span>
                  </div>

                  {selectedCardForView.description && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Habilidad</label>
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{selectedCardForView.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de cerrar */}
              <div className="pt-4 mt-6 border-t border-[#2D9B96]">
                <button
                  onClick={() => setSelectedCardForView(null)}
                  className="w-full px-6 py-3 bg-[#1A2332] border border-[#2D9B96] text-[#4ECDC4] rounded-lg hover:bg-[#2D9B96] hover:text-white transition-colors font-medium shadow-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

