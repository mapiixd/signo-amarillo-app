import { normalizeString } from '@/lib/utils'

const VCR_BASE_RARITIES = ['VASALLO', 'CORTESANO', 'REAL'] as const

/**
 * Excepciones de rareza en Imperio VCR: cartas que no son Vasallo/Cortesano/Real
 * pero están explícitamente autorizadas (p. ej. promo).
 * Nombres normalizados (sin tildes, minúsculas) para coincidir con la carta en BD.
 */
const VCR_RARITY_EXCEPTIONS: readonly { names: readonly string[]; rarity: string }[] = [
  { names: ['laterna', 'la laterna'], rarity: 'PROMO' }
]

export function isVCRPermittedRarity(card: { name: string; rarity: string }): boolean {
  if ((VCR_BASE_RARITIES as readonly string[]).includes(card.rarity)) {
    return true
  }
  const n = normalizeString(card.name.trim())
  return VCR_RARITY_EXCEPTIONS.some(
    (ex) => ex.rarity === card.rarity && ex.names.includes(n)
  )
}
