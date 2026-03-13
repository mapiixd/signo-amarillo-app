/**
 * Formato Imperio Triadas: facciones y razas permitidas.
 * - Paladín: Caballero, Guerrero, Héroe
 * - Desafiante: Faerie, Eterno, Sacerdote
 * - Tenebris: Bestia, Dragón, Sombra
 */

export type TriadaName = 'Paladín' | 'Desafiante' | 'Tenebris'

export const TRIADA_RACES: Record<TriadaName, readonly string[]> = {
  Paladín: ['Caballero', 'Guerrero', 'Héroe'],
  Desafiante: ['Faerie', 'Eterno', 'Sacerdote'],
  Tenebris: ['Bestia', 'Dragón', 'Sombra']
} as const

export const TRIADAS: { name: TriadaName; image: string }[] = [
  { name: 'Paladín', image: '/razas/Paladín.png' },
  { name: 'Desafiante', image: '/razas/Desafiante.png' },
  { name: 'Tenebris', image: '/razas/Tenebris.png' }
]

/** Razas de una triada como array (para validaciones) */
export function getRacesForTriada(triada: TriadaName): string[] {
  return [...TRIADA_RACES[triada]]
}

/**
 * Cartas que en su print más antiguo (edición fuera de rotación) eran Ultra Real,
 * pero en rotación solo están vigentes como promocionales. En Triadas van a 2 copias, no 1.
 * Comparación por nombre normalizado (minúsculas, sin tildes) para evitar variantes.
 */
export const TRIADAS_EX_UR_SOLO_PROMO: ReadonlySet<string> = new Set([
  'batalla de waterloo',
  'sable de napoleon',
  'sable de napoleón',
  'fuente de la juventud'
])

export function isTriadasExURSoloPromo(cardName: string): boolean {
  const normalized = cardName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return [...TRIADAS_EX_UR_SOLO_PROMO].some(
    key => key.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalized
  )
}

/** Comprueba si un aliado con raza cardRace (puede ser multi-raza) está permitido en la triada */
export function allyMatchesTriada(cardRace: string | null, triada: TriadaName): boolean {
  const r = (cardRace || '').trim()
  if (r === '' || r === 'Sin Raza') return true
  const allowed = TRIADA_RACES[triada]
  return allowed.some(race => r.includes(race))
}
