'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { Card as CardType, CARD_TYPE_LABELS } from '@/types'
import { getCardImageUrl } from '@/lib/cdn'
import { getCardBanStatus, isCardBanned, getMaxCopies, getBanStatusIcon, getBanStatusLabel, type FormatType, type BanStatus } from '@/lib/banlist'
import Footer from '@/components/Footer'

interface SelectedCard {
  card: CardType
  quantity: number
}

interface Expansion {
  id: string
  name: string
  display_order: number
}

function NewDeckPageContent() {
  useEffect(() => {
    document.title = 'Forja de Mazos | El Signo Amarillo';
  }, [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const raceParam = searchParams.get('race')
  
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<CardType[]>([])
  const [expansions, setExpansions] = useState<Expansion[]>([])
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [sideboard, setSideboard] = useState<SelectedCard[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [abilityFilter, setAbilityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('Todas')
  const [expansionFilter, setExpansionFilter] = useState<string>('Todas')
  const [deckRace, setDeckRace] = useState<string>(raceParam || '')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'main' | 'sidedeck'>('main')
  const [selectedCardForView, setSelectedCardForView] = useState<CardType | null>(null)
  const [banlistCache, setBanlistCache] = useState<Record<string, { status: BanStatus; maxCopies: number } | null>>({})
  
  // Referencias para auto-scroll
  const mainDeckScrollRef = useRef<HTMLDivElement>(null)
  const sidedeckScrollRef = useRef<HTMLDivElement>(null)
  const prevMainDeckLengthRef = useRef<number>(0)
  const prevSideboardLengthRef = useRef<number>(0)
  const modalHistoryPushedRef = useRef<boolean>(false)
  const STORAGE_KEY = 'deck-builder-draft'

  // Funciones para guardar y cargar el progreso
  const saveProgress = useCallback(() => {
    if (selectedCards.length > 0 || sideboard.length > 0 || name.trim()) {
      const progress = {
        name,
        isPublic,
        selectedCards: selectedCards.map(sc => ({
          cardId: sc.card.id,
          cardName: sc.card.name,
          quantity: sc.quantity
        })),
        sideboard: sideboard.map(sc => ({
          cardId: sc.card.id,
          cardName: sc.card.name,
          quantity: sc.quantity
        })),
        deckRace,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }
  }, [selectedCards, sideboard, name, isPublic, deckRace])

  const loadProgress = useCallback(async (): Promise<boolean> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return false

      const progress = JSON.parse(saved)
      
      // Verificar que el progreso guardado sea de la misma raza
      if (progress.deckRace !== deckRace) {
        localStorage.removeItem(STORAGE_KEY)
        return false
      }

      // Si hay cartas guardadas, intentar restaurarlas
      if (progress.selectedCards?.length > 0 || progress.sideboard?.length > 0) {
        // Esperar a que las cartas se carguen
        if (cards.length === 0) {
          await new Promise(resolve => {
            const checkCards = setInterval(() => {
              if (cards.length > 0) {
                clearInterval(checkCards)
                resolve(true)
              }
            }, 100)
            setTimeout(() => {
              clearInterval(checkCards)
              resolve(false)
            }, 5000)
          })
        }

        // Restaurar nombre y visibilidad
        if (progress.name) setName(progress.name)
        setIsPublic(progress.isPublic ?? true)

        // Restaurar cartas del mazo principal
        const restoredMain: SelectedCard[] = []
        for (const savedCard of progress.selectedCards || []) {
          const card = cards.find(c => c.id === savedCard.cardId || c.name === savedCard.cardName)
          if (card) {
            restoredMain.push({
              card,
              quantity: savedCard.quantity
            })
          }
        }

        // Restaurar cartas del sideboard
        const restoredSide: SelectedCard[] = []
        for (const savedCard of progress.sideboard || []) {
          const card = cards.find(c => c.id === savedCard.cardId || c.name === savedCard.cardName)
          if (card) {
            restoredSide.push({
              card,
              quantity: savedCard.quantity
            })
          }
        }

        if (restoredMain.length > 0 || restoredSide.length > 0) {
          setSelectedCards(restoredMain)
          setSideboard(restoredSide)
          return true
        }
      } else if (progress.name) {
        // Solo restaurar nombre si no hay cartas
        setName(progress.name)
        setIsPublic(progress.isPublic ?? true)
        return true
      }

      return false
    } catch (error) {
      console.error('Error loading progress:', error)
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }, [cards, deckRace])

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Guardar progreso automáticamente cuando cambia el estado
  useEffect(() => {
    if (!loading && cards.length > 0) {
      saveProgress()
    }
  }, [saveProgress, loading, cards.length])

  // Cargar progreso guardado al montar el componente (solo una vez)
  const hasLoadedProgressRef = useRef(false)
  useEffect(() => {
    if (!loading && cards.length > 0 && raceParam && !hasLoadedProgressRef.current) {
      hasLoadedProgressRef.current = true
      loadProgress().then(hasProgress => {
        if (hasProgress) {
          Swal.fire({
            icon: 'info',
            title: 'Progreso recuperado',
            text: 'Se ha restaurado tu progreso anterior',
            confirmButtonColor: '#2D9B96',
            background: '#121825',
            color: '#F4C430',
            timer: 3000,
            showConfirmButton: false
          })
        }
      })
    }
  }, [loading, cards.length, raceParam, loadProgress])

  // Interceptar navegación hacia atrás para guardar progreso
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress()
    }

    const handlePopState = () => {
      // Si el modal no está abierto, guardar progreso antes de navegar
      if (!selectedCardForView) {
        saveProgress()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [saveProgress, selectedCardForView])

  // Prevenir retroceso del navegador cuando el modal está abierto
  useEffect(() => {
    if (selectedCardForView) {
      // Agregar una entrada al historial cuando se abre el modal
      window.history.pushState({ modalOpen: true }, '')
      modalHistoryPushedRef.current = true
      
      const handlePopState = () => {
        // Si el modal está abierto, cerrarlo en lugar de navegar hacia atrás
        setSelectedCardForView(null)
        modalHistoryPushedRef.current = false
      }
      
      window.addEventListener('popstate', handlePopState)
      
      return () => {
        window.removeEventListener('popstate', handlePopState)
        // Si el modal se cierra normalmente (no por botón de retroceso), hacer retroceder el historial
        if (modalHistoryPushedRef.current && window.history.state?.modalOpen) {
          window.history.back()
          modalHistoryPushedRef.current = false
        }
      }
    } else {
      modalHistoryPushedRef.current = false
    }
  }, [selectedCardForView])

  // Redirigir si no hay raza seleccionada
  useEffect(() => {
    if (!raceParam) {
      router.push('/decks/format-select')
    }
  }, [raceParam, router])

  useEffect(() => {
    fetchCards()
    fetchExpansions()
  }, [])

  // Precargar banlist para todas las cartas cuando cambian
  useEffect(() => {
    const loadBanlistForCards = async () => {
      if (cards.length === 0) return
      
      const format = 'Imperio Racial' as FormatType
      const cache: Record<string, { status: BanStatus; maxCopies: number } | null> = {}
      
      // Cargar banlist para todas las cartas
      const promises = cards.map(async (card) => {
        const status = await getCardBanStatus(card.name, format)
        return { name: card.name, status }
      })
      
      const results = await Promise.all(promises)
      results.forEach(({ name, status }) => {
        cache[name] = status
      })
      
      setBanlistCache(cache)
    }
    
    loadBanlistForCards()
  }, [cards])

  // Auto-scroll solo cuando se agrega una nueva carta al mazo principal (no cuando se modifica cantidad)
  useEffect(() => {
    if (mainDeckScrollRef.current && activeTab === 'main' && selectedCards.length > prevMainDeckLengthRef.current) {
      mainDeckScrollRef.current.scrollTop = mainDeckScrollRef.current.scrollHeight
    }
    prevMainDeckLengthRef.current = selectedCards.length
  }, [selectedCards.length, activeTab])

  // Auto-scroll solo cuando se agrega una nueva carta al sidedeck (no cuando se modifica cantidad)
  useEffect(() => {
    if (sidedeckScrollRef.current && activeTab === 'sidedeck' && sideboard.length > prevSideboardLengthRef.current) {
      sidedeckScrollRef.current.scrollTop = sidedeckScrollRef.current.scrollHeight
    }
    prevSideboardLengthRef.current = sideboard.length
  }, [sideboard.length, activeTab])

  const fetchCards = async () => {
    try {
      // Obtener solo las cartas en rotación (desde Espiritu Samurai en adelante)
      const response = await fetch('/api/cards?rotation=true')
      if (response.ok) {
        const data = await response.json()
        setCards(data)
      }
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpansions = async () => {
    try {
      const response = await fetch('/api/expansions')
      if (response.ok) {
        const data = await response.json()
        setExpansions(data)
      }
    } catch (error) {
      console.error('Error fetching expansions:', error)
    }
  }

  // Helper para determinar si una carta es "sin raza"
  const isRaceless = (card: CardType): boolean => {
    if (card.type !== 'ALIADO') return false
    const race = card.race?.trim() || ''
    return race === '' || race === 'Sin Raza'
  }

  const handleAddCard = async (card: CardType, toSideboard: boolean = false) => {
    const currentDeck = toSideboard ? sideboard : selectedCards
    const setDeck = toSideboard ? setSideboard : setSelectedCards
    
    // Buscar por nombre normalizado (case-insensitive) para agrupar todas las versiones de la misma carta
    const normalizedCardName = card.name.trim().toLowerCase()
    const existing = currentDeck.find(sc => sc.card.name.trim().toLowerCase() === normalizedCardName)
    const totalInBothDecks = getTotalCopiesByName(card.name)
    
    // Calcular el total de cartas en el mazo actual
    const currentTotal = currentDeck.reduce((sum, sc) => sum + sc.quantity, 0)
    
    // Validar límite de cartas en el mazo
    if (!toSideboard && currentTotal >= 50) {
      Swal.fire({
        icon: 'warning',
        title: 'Mazo completo',
        text: 'El mazo principal ya tiene 50 cartas. No puedes agregar más.',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }
    
    if (toSideboard && currentTotal >= 15) {
      Swal.fire({
        icon: 'warning',
        title: 'Sidedeck completo',
        text: 'El sidedeck ya tiene 15 cartas. No puedes agregar más.',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }
    
    // Validar si la carta está prohibida en el formato
    const format = 'Imperio Racial' as FormatType
    try {
      const isBanned = await isCardBanned(card.name, format)
      if (isBanned) {
        Swal.fire({
          icon: 'error',
          title: 'Carta Prohibida',
          text: `${card.name} está PROHIBIDA en el formato ${format}`,
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        return
      }
    } catch (error) {
      console.error('Error checking if card is banned:', error)
    }
    
    // Validar cartas únicas (que contengan "Única." en su descripción)
    const isUniqueCard = card.description?.includes('Única.') || false
    if (isUniqueCard && totalInBothDecks >= 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Carta Única',
        text: `${card.name} es una carta única. Solo puedes tener 1 copia en tu mazo (incluyendo sidedeck).`,
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }
    
    // Validar límite de copias según banlist (puede ser 1, 2 o 3)
    try {
      const maxAllowed = await getMaxCopies(card.name, format)
      if (totalInBothDecks >= maxAllowed) {
        const banStatus = await getCardBanStatus(card.name, format)
        const statusText = banStatus ? getBanStatusLabel(banStatus.status, banStatus.maxCopies) : ''
        
        Swal.fire({
          icon: 'warning',
          title: 'Límite alcanzado',
          text: `No puedes tener más de ${maxAllowed} ${maxAllowed === 1 ? 'copia' : 'copias'} de ${card.name}${statusText ? ` (${statusText})` : ''}`,
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        return
      }
    } catch (error) {
      console.error('Error checking card limits:', error)
    }
    
    // Validar máximo 4 aliados sin raza en el mazo principal
    if (!toSideboard && isRaceless(card)) {
      const currentRacelessAllies = selectedCards
        .filter(sc => isRaceless(sc.card))
        .reduce((sum, sc) => sum + sc.quantity, 0)
      
      // Verificar si agregar esta carta excederá el límite de 4
      const newTotal = currentRacelessAllies + 1
      
      if (newTotal > 4) {
        Swal.fire({
          icon: 'warning',
          title: 'Límite alcanzado',
          text: 'No puedes tener más de 4 aliados sin raza en el mazo principal',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
        return
      }
    }
    
    if (existing) {
      // Si ya existe una versión de esta carta (por nombre), incrementar su cantidad
      setDeck(currentDeck.map(sc => 
        sc.card.name.trim().toLowerCase() === normalizedCardName ? { ...sc, quantity: sc.quantity + 1 } : sc
      ))
    } else {
      setDeck([...currentDeck, { card, quantity: 1 }])
    }
  }

  const handleRemoveCard = (cardId: string, fromSideboard: boolean = false) => {
    const currentDeck = fromSideboard ? sideboard : selectedCards
    const setDeck = fromSideboard ? setSideboard : setSelectedCards
    
    const existing = currentDeck.find(sc => sc.card.id === cardId)
    if (existing && existing.quantity > 1) {
      setDeck(currentDeck.map(sc => 
        sc.card.id === cardId ? { ...sc, quantity: sc.quantity - 1 } : sc
      ))
    } else {
      setDeck(currentDeck.filter(sc => sc.card.id !== cardId))
    }
  }

  // Función para contar copias por nombre (agrupa todas las versiones de la misma carta)
  const getTotalCopiesByName = (cardName: string): number => {
    const normalizedName = cardName.trim().toLowerCase()
    const mainCount = selectedCards
      .filter(sc => sc.card.name.trim().toLowerCase() === normalizedName)
      .reduce((sum, sc) => sum + sc.quantity, 0)
    const sideCount = sideboard
      .filter(sc => sc.card.name.trim().toLowerCase() === normalizedName)
      .reduce((sum, sc) => sum + sc.quantity, 0)
    return mainCount + sideCount
  }

  // Mantener función por ID para compatibilidad con otros lugares del código
  const getTotalCopies = (cardId: string): number => {
    const mainCount = selectedCards.find(sc => sc.card.id === cardId)?.quantity || 0
    const sideCount = sideboard.find(sc => sc.card.id === cardId)?.quantity || 0
    return mainCount + sideCount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la baraja es requerido',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }

    // Validar restricciones del mazo principal
    const validationError = validateMainDeck()
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: validationError,
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }

    // Validar restricciones del sidedeck
    const sideboardError = validateSideboard()
    if (sideboardError) {
      Swal.fire({
        icon: 'error',
        title: 'Error en el sidedeck',
        text: sideboardError,
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          race: deckRace,
          is_public: isPublic,
          cards: selectedCards.map(sc => ({
            id: sc.card.id,
            quantity: sc.quantity
          })),
          sideboard: sideboard.map(sc => ({
            id: sc.card.id,
            quantity: sc.quantity
          }))
        })
      })

      if (response.ok) {
        // Limpiar el progreso guardado después de guardar exitosamente
        clearProgress()
        hasLoadedProgressRef.current = false
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Baraja creada exitosamente',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430',
          timer: 2000,
          showConfirmButton: false
        })
        router.push('/decks')
      } else {
        const error = await response.json()
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'No se pudo crear la baraja',
          confirmButtonColor: '#2D9B96',
          background: '#121825',
          color: '#F4C430'
        })
      }
    } catch (error) {
      console.error('Error creating deck:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear la baraja',
        confirmButtonColor: '#2D9B96',
        background: '#121825',
        color: '#F4C430'
      })
    } finally {
      setSaving(false)
    }
  }

  const validateMainDeck = (): string | null => {
    const totalMain = selectedCards.reduce((sum, sc) => sum + sc.quantity, 0)
    
    // Validar que el mazo tenga exactamente 50 cartas
    if (totalMain !== 50) {
      return `El mazo principal debe tener exactamente 50 cartas. Actualmente tiene ${totalMain}.`
    }
    
    // Contar aliados, armas y tótems
    const allyWeaponTotemCount = selectedCards
      .filter(sc => ['ALIADO', 'ARMA', 'TOTEM'].includes(sc.card.type))
      .reduce((sum, sc) => sum + sc.quantity, 0)
    
    if (allyWeaponTotemCount < 17) {
      return `Debes tener al menos 17 cartas entre Aliados, Armas y Tótems. Actualmente tienes ${allyWeaponTotemCount}.`
    }
    
    // Validar máximo 4 aliados sin raza (race === null o vacío)
    const alliesWithoutRace = selectedCards
      .filter(sc => isRaceless(sc.card))
      .reduce((sum, sc) => sum + sc.quantity, 0)
    
    if (alliesWithoutRace > 4) {
      return `No puedes tener más de 4 aliados sin raza en el mazo principal. Actualmente tienes ${alliesWithoutRace}.`
    }
    
    return null
  }

  const validateSideboard = (): string | null => {
    const totalSideboard = sideboard.reduce((sum, sc) => sum + sc.quantity, 0)
    
    // Validar que el sidedeck tenga exactamente 15 cartas
    if (totalSideboard > 0 && totalSideboard !== 15) {
      return `El sidedeck debe tener exactamente 15 cartas si decides usarlo. Actualmente tiene ${totalSideboard}.`
    }
    
    return null
  }

  const filteredCards = cards
    .filter(card => {
      const matchesSearch = !searchTerm || (card.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
      const matchesAbility = !abilityFilter || (card.description?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(abilityFilter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ?? false)
      const matchesType = typeFilter === 'Todas' || card.type === typeFilter
      const matchesExpansion = expansionFilter === 'Todas' || card.expansion === expansionFilter
      
      // Filtro por raza del mazo: Si es aliado, solo mostrar los de la raza del mazo o sin raza
      let matchesRace = true
      if (card.type === 'ALIADO') {
        const cardRace = card.race?.trim() || ''
        
        // Siempre incluir cartas "Sin Raza" o sin raza definida
        if (cardRace === '' || cardRace === 'Sin Raza') {
          matchesRace = true
        } else {
          // Si el aliado tiene raza específica, debe CONTENER la raza del mazo (para soportar multi-raza)
          // Ej: "Bestia, Dragón, Sombra" contiene "Sombra"
          matchesRace = cardRace.includes(deckRace)
        }
      }
      // Si no es aliado (Arma, Talismán, Tótem, Oro), siempre se muestra
      
      return matchesSearch && matchesAbility && matchesType && matchesExpansion && matchesRace
    })
    .sort((a, b) => {
      // Ordenar por coste (ascendente)
      // Para ALIADO, ARMA, TALISMAN, TOTEM: null o vacío = 0
      // Para ORO: null va al final (999)
      const normalizeCost = (card: CardType): number => {
        if (card.type === 'ORO') {
          return card.cost ?? 999 // ORO sin coste va al final
        }
        // Para ALIADO, ARMA, TALISMAN, TOTEM: null o vacío = 0
        return card.cost ?? 0
      }
      
      const costA = normalizeCost(a)
      const costB = normalizeCost(b)
      
      if (costA !== costB) {
        return costA - costB
      }
      
      // Si tienen el mismo coste, ordenar por nombre
      return a.name.localeCompare(b.name)
    })

  const totalCards = selectedCards.reduce((sum, sc) => sum + sc.quantity, 0)
  const totalSideboard = sideboard.reduce((sum, sc) => sum + sc.quantity, 0)
  
  // Obtener tipos únicos
  const cardTypes = ['Todas', ...Array.from(new Set(cards.map(card => card.type)))]

  // Calcular estadísticas del mazo principal
  const allyCount = selectedCards.filter(sc => sc.card.type === 'ALIADO').reduce((sum, sc) => sum + sc.quantity, 0)
  const weaponCount = selectedCards.filter(sc => sc.card.type === 'ARMA').reduce((sum, sc) => sum + sc.quantity, 0)
  const talismanCount = selectedCards.filter(sc => sc.card.type === 'TALISMAN').reduce((sum, sc) => sum + sc.quantity, 0)
  const totemCount = selectedCards.filter(sc => sc.card.type === 'TOTEM').reduce((sum, sc) => sum + sc.quantity, 0)
  const goldCount = selectedCards.filter(sc => sc.card.type === 'ORO').reduce((sum, sc) => sum + sc.quantity, 0)
  const allyWeaponTotemCount = allyCount + weaponCount + totemCount
  const alliesWithoutRace = selectedCards.filter(sc => isRaceless(sc.card)).reduce((sum, sc) => sum + sc.quantity, 0)
  
  // Calcular coste promedio excluyendo las cartas de ORO
  const cardsWithCost = selectedCards.filter(sc => sc.card.type !== 'ORO')
  const totalCardsWithCost = cardsWithCost.reduce((sum, sc) => sum + sc.quantity, 0)
  const avgCost = totalCardsWithCost > 0 
    ? (cardsWithCost.reduce((sum, sc) => sum + (sc.card.cost || 0) * sc.quantity, 0) / totalCardsWithCost).toFixed(2)
    : '0.00'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D9B96] mx-auto mb-4"></div>
          <p className="text-[#F4C430]">Cargando cartas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#2D9B96] hover:text-[#4ECDC4] mb-4 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-[#F4C430] mb-2">
            Constructor de Mazos - Raza: {deckRace}
          </h1>
          <p className="text-[#2D9B96] text-sm mb-1">
            Formato: Imperio Racial | Solo se mostrarán aliados de raza {deckRace} o sin raza
          </p>
          <p className="text-[#F4C430] text-xs italic">
          📋 Rotación activa: Espíritu Samurai - KvsM : Titanes
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Panel Izquierdo - Selector de Cartas */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-3 sm:p-6">
            {/* Barra de búsqueda y filtros */}
            <div className="mb-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg text-white focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder-[#707070]"
                  placeholder="🔍 Buscar carta por nombre..."
                />
              </div>

              {/* Filtro por habilidad */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={abilityFilter}
                  onChange={(e) => setAbilityFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg text-white focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder-[#707070]"
                  placeholder="✨ Buscar por habilidad..."
                />
              </div>

              {/* Botones de filtro por tipo */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setTypeFilter('Todas')}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                    typeFilter === 'Todas' 
                      ? 'bg-[#F4C430] text-[#0A0E1A]' 
                      : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#2D9B96] hover:text-white'
                  }`}
                >
                  Todas
                </button>
                {cardTypes.filter(t => t !== 'Todas').map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                      typeFilter === type 
                        ? 'bg-[#F4C430] text-[#0A0E1A]' 
                        : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#2D9B96] hover:text-white'
                    }`}
                  >
                    {type === 'ALIADO' && '🗡️'} 
                    {type === 'ARMA' && '⚔️'} 
                    {type === 'TALISMAN' && '✨'} 
                    {type === 'TOTEM' && '🗿'} 
                    {type === 'ORO' && '💰'}
                    <span className="hidden sm:inline">{' '}{CARD_TYPE_LABELS[type as keyof typeof CARD_TYPE_LABELS] || type}</span>
                  </button>
                ))}
              </div>

              {/* Filtro por expansión */}
              <div className="mb-4">
                <label className="block text-[#F4C430] font-semibold mb-2 text-sm">
                  Filtrar por Expansión
                </label>
                <select
                  value={expansionFilter}
                  onChange={(e) => setExpansionFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] text-[#E8E8E8] shadow-sm transition-all cursor-pointer"
                >
                  <option value="Todas">Todas las expansiones</option>
                  {expansions.map(expansion => (
                    <option key={expansion.id} value={expansion.name}>
                      {expansion.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid de cartas - Solo imágenes */}
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 py-4 px-2 custom-scrollbar">
              {filteredCards.map(card => {
                const imageUrl = card.image_url ? getCardImageUrl(card.image_url) : null
                const totalCopies = getTotalCopiesByName(card.name)
                const format = 'Imperio Racial' as FormatType
                const banStatus = banlistCache[card.name] || null
                const isBanned = banStatus?.status === 'banned'
                const isUniqueCard = card.description?.includes('Única.') || false
                
                return (
                  <div
                    key={card.id}
                    className="relative group"
                  >
                    <div 
                      className={`aspect-[2.5/3.5] bg-[#1A2332] rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-xl relative ${
                        isBanned 
                          ? 'border-red-600 opacity-60 hover:border-red-500' 
                          : 'border-[#2D9B96] hover:border-[#F4C430] hover:shadow-[#F4C430]/50'
                      }`}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={card.name}
                          className={`w-full h-full object-contain ${isBanned ? 'grayscale' : ''}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#4ECDC4] text-xs text-center p-2">
                          Sin imagen
                        </div>
                      )}
                      
                      {/* Marca de prohibida */}
                      {isBanned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                          <span className="text-5xl">⛔</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Badge de carta única */}
                    {isUniqueCard && (
                      <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 bg-purple-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg border-2 border-purple-400 z-20" title="Carta Única - Máximo 1 copia">
                        ⭐
                      </div>
                    )}
                    
                    {/* Badge de banlist (limitada) */}
                    {banStatus && banStatus.status !== 'banned' && !isUniqueCard && (
                      <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 bg-yellow-500 text-black rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg border-2 border-yellow-600 z-20" title={getBanStatusLabel(banStatus.status, banStatus.maxCopies)}>
                        {getBanStatusIcon(banStatus.status)}
                      </div>
                    )}
                    
                    {/* Badge de cantidad total (principal + refuerzo) */}
                    {totalCopies > 0 && (
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-[#F4C430] text-[#0A0E1A] rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg border-2 border-[#2D9B96] z-20">
                        {totalCopies}
                      </div>
                    )}

                    {/* Nombre y botones siempre visibles */}
                    <div className="mt-2 space-y-1">
                      <p className={`text-[10px] sm:text-xs font-semibold text-center truncate px-1 ${
                        isBanned ? 'text-red-400' : 'text-white'
                      }`}>
                        {isUniqueCard && <span className="mr-1 text-purple-400">⭐</span>}
                        {banStatus && !isBanned && !isUniqueCard && <span className="mr-1">{getBanStatusIcon(banStatus.status)}</span>}
                        {card.name}
                        {isUniqueCard && <span className="ml-1 text-purple-400">(1)</span>}
                        {!isUniqueCard && banStatus && banStatus.maxCopies < 3 && !isBanned && (
                          <span className="ml-1 text-yellow-400">({banStatus.maxCopies})</span>
                        )}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAddCard(card, activeTab === 'sidedeck')}
                          disabled={isBanned}
                          className={`flex-1 text-[10px] sm:text-xs py-1 sm:py-1.5 rounded transition-colors font-medium ${
                            isBanned 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-[#2D9B96] hover:bg-[#4ECDC4] text-white'
                          }`}
                        >
                          {isBanned ? '⛔ Prohibida' : '+ Agregar'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCardForView(card)
                          }}
                          className="px-2 sm:px-3 bg-[#1A2332] hover:bg-[#0A0E1A] text-[#4ECDC4] hover:text-[#F4C430] text-[10px] sm:text-xs py-1 sm:py-1.5 rounded transition-colors border border-[#2D9B96]"
                          title="Ver carta"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#E8E8E8] text-lg">No se encontraron cartas</p>
              </div>
            )}
          </div>

          {/* Panel Derecho - Mazo Actual */}
          <div className="bg-[#121825] border border-[#2D9B96] rounded-lg shadow-lg p-3 sm:p-6 lg:sticky lg:top-4 max-h-[calc(100vh-50px)]">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Input nombre del mazo */}
              <div className="mb-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg text-white font-semibold text-lg focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder-[#707070]"
                  placeholder="Mi Nuevo Mazo"
                  required
                />
              </div>

              {/* Tabs para Mazo Principal y Refuerzo */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('main')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'main'
                      ? 'bg-[#2D9B96] text-white'
                      : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#0A0E1A]'
                  }`}
                >
                  Principal ({totalCards}/50)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sidedeck')}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'sidedeck'
                      ? 'bg-[#2D9B96] text-white'
                      : 'bg-[#1A2332] text-[#A0A0A0] hover:bg-[#0A0E1A]'
                  }`}
                >
                  Sidedeck ({totalSideboard}/15)
                </button>
              </div>

              {/* Estadísticas del mazo principal */}
              {activeTab === 'main' && (
                <div className="bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg p-3 mb-3">
                  <h3 className="text-[#F4C430] font-bold text-lg mb-2 text-center">
                    Total: {totalCards} / 50
                  </h3>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span>🗡️ Aliados: <span className="text-[#2D9B96]">{allyCount}</span></span>
                      <span>⚔️ Armas: <span className="text-[#2D9B96]">{weaponCount}</span></span>
                      <span>💰 Oros: <span className="text-[#F4C430]">{goldCount}</span></span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8]">
                      <span>✨ Talismanes: <span className="text-[#2D9B96]">{talismanCount}</span></span>
                      <span>🗿 Tótems: <span className="text-[#2D9B96]">{totemCount}</span></span>
                    </div>
                    <div className="flex items-center justify-between text-[#E8E8E8] pt-1 border-t border-[#2D9B96] mt-1">
                      <span>A+A+T: <span className={allyWeaponTotemCount >= 17 ? 'text-[#2D9B96]' : 'text-[#E74860]'}>{allyWeaponTotemCount}</span> <span className="text-[#A0A0A0] text-[10px]">(≥17)</span></span>
                      <span>Sin raza: <span className={alliesWithoutRace <= 4 ? 'text-[#2D9B96]' : 'text-[#E74860]'}>{alliesWithoutRace}</span> <span className="text-[#A0A0A0] text-[10px]">(≤4)</span></span>
                      <span>Costo: <span className="text-[#F4C430]">{avgCost}</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Estadísticas del sidedeck */}
              {activeTab === 'sidedeck' && (
                <div className="bg-[#1A2332] border-2 border-[#2D9B96] rounded-lg p-3 mb-3">
                  <h3 className="text-[#F4C430] font-bold text-lg mb-1 text-center">
                    Total: {totalSideboard} / 15
                  </h3>
                  <p className="text-[#A0A0A0] text-xs text-center">
                    Opcional - Debe tener exactamente 15 cartas
                  </p>
                </div>
              )}

              {/* Lista de cartas seleccionadas */}
              <div 
                ref={activeTab === 'main' ? mainDeckScrollRef : sidedeckScrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar mb-4"
              >
                {(activeTab === 'main' ? selectedCards : sideboard).length > 0 ? (
                  <div className="space-y-2">
                    {(activeTab === 'main' ? selectedCards : sideboard).map(sc => {
                      const imageUrl = sc.card.image_url ? getCardImageUrl(sc.card.image_url) : null
                      const isSideboard = activeTab === 'sidedeck'
                      
                      return (
                        <div
                          key={sc.card.id}
                          className="bg-[#1A2332] border border-[#2D9B96] rounded-lg p-2 flex items-center gap-3"
                        >
                          {/* Miniatura de la carta */}
                          <div className="w-12 h-16 bg-[#0A0E1A] rounded overflow-hidden flex-shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={sc.card.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#4ECDC4] text-xs">
                                ?
                              </div>
                            )}
                          </div>

                          {/* Info de la carta */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {sc.card.name}
                            </p>
                            <p className="text-[#A0A0A0] text-xs">
                              {CARD_TYPE_LABELS[sc.card.type as keyof typeof CARD_TYPE_LABELS]}
                              {sc.card.race && ` - ${sc.card.race}`}
                            </p>
                          </div>

                          {/* Controles */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCardForView(sc.card)}
                              className="text-[#2D9B96] hover:text-[#4ECDC4] text-sm"
                              title="Ver carta"
                            >
                              👁️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCard(sc.card.id, isSideboard)}
                              className="text-[#E74860] hover:text-[#FF6B7A] font-bold text-lg w-6 h-6 flex items-center justify-center rounded hover:bg-[#0A0E1A]"
                            >
                              −
                            </button>
                            <span className="text-[#F4C430] font-bold text-lg min-w-[2ch] text-center">
                              {sc.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddCard(sc.card, isSideboard)}
                              className="text-[#2D9B96] hover:text-[#4ECDC4] font-bold text-lg w-6 h-6 flex items-center justify-center rounded hover:bg-[#0A0E1A]"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isSideboard) {
                                  setSideboard(sideboard.filter(c => c.card.id !== sc.card.id))
                                } else {
                                  setSelectedCards(selectedCards.filter(c => c.card.id !== sc.card.id))
                                }
                              }}
                              className="text-[#E74860] hover:text-[#FF6B7A] ml-1"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#A0A0A0]">
                      {activeTab === 'main' 
                        ? 'Selecciona cartas para tu mazo principal' 
                        : 'Selecciona cartas para tu mazo de refuerzo'}
                    </p>
                  </div>
                )}
              </div>

              {/* Toggle privado */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer bg-[#1A2332] border border-[#2D9B96] rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={!isPublic}
                    onChange={(e) => setIsPublic(!e.target.checked)}
                    className="w-5 h-5 accent-[#2D9B96]"
                  />
                  <div className="flex-1">
                    <span className="text-[#E8E8E8] font-semibold">Hacer este mazo privado</span>
                    <p className="text-xs text-[#A0A0A0] mt-1">
                      {isPublic ? '🌍 Tu mazo será visible públicamente' : '🔒 Solo tú podrás ver este mazo'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={saving || totalCards !== 50}
                  className="w-full px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title={totalCards !== 50 ? 'El mazo principal debe tener exactamente 50 cartas' : ''}
                >
                  {saving ? 'Guardando...' : 'Guardar Mazo'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full px-6 py-3 bg-[#0A0E1A] text-white rounded-lg hover:bg-[#1A2332] transition-all font-semibold border border-[#2D9B96]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal para ver detalles de la carta */}
      {selectedCardForView && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCardForView(null)}
        >
          <div 
            className="bg-[#121825] border-2 border-[#2D9B96] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="sticky top-0 bg-[#121825] border-b border-[#2D9B96] p-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F4C430]">
                {selectedCardForView.name}
              </h2>
              <button
                onClick={() => setSelectedCardForView(null)}
                className="text-[#4ECDC4] hover:text-[#F4C430] text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1A2332] transition-colors"
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
                      const imageUrl = selectedCardForView.image_url ? getCardImageUrl(selectedCardForView.image_url) : null
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
                      {CARD_TYPE_LABELS[selectedCardForView.type as keyof typeof CARD_TYPE_LABELS]}
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

                  {selectedCardForView.description && (
                    <div>
                      <label className="block text-sm font-semibold text-[#4ECDC4] mb-1">Habilidad</label>
                      <p className="text-[#A0A0A0] text-sm leading-relaxed">{selectedCardForView.description}</p>
                    </div>
                  )}

                  {/* Botón para agregar desde el modal */}
                  <div className="pt-4 border-t border-[#2D9B96]">
                    <button
                      onClick={() => {
                        handleAddCard(selectedCardForView, activeTab === 'sidedeck')
                        setSelectedCardForView(null)
                      }}
                      className="w-full px-6 py-3 bg-[#2D9B96] text-white rounded-lg hover:bg-[#4ECDC4] transition-all font-semibold"
                    >
                      + Agregar al mazo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A2332;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2D9B96;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4ECDC4;
        }
      `}</style>
    </div>
  )
}

export default function NewDeckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#121825] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4C430] mx-auto mb-4 signo-glow"></div>
          <p className="text-[#4ECDC4]">Cargando...</p>
        </div>
      </div>
    }>
      <NewDeckPageContent />
    </Suspense>
  )
}

