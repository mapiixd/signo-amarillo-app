import { getSupabaseClient } from '@/lib/supabase-server'
import type {
  Card,
  DeckBanlistIssue,
  DeckBanlistIssueZone,
  DeckBanlistStatus,
  DeckCardEntry,
} from '@/types'
import type { BanStatus, FormatType } from '@/lib/banlist'

type DeckLikeForAudit = {
  id?: string
  format?: string | null
  cards?: DeckCardEntry[]
  sideboard?: DeckCardEntry[]
}

type ExpandedDeckEntry = DeckCardEntry & {
  card?: Card | null
}

type BanlistDbEntry = {
  card_name: string
  format: string
  status: BanStatus
  max_copies: number | null
}

export type DeckBanlistAuditResult = {
  status: DeckBanlistStatus
  issues: DeckBanlistIssue[]
  checkedAt: string
}

const FORMATS: FormatType[] = ['Imperio Racial', 'VCR', 'Triadas']

export function normalizeDeckFormat(format?: string | null): FormatType {
  if (format === 'VCR') return 'VCR'
  if (format === 'Triadas') return 'Triadas'
  return 'Imperio Racial'
}

function normalizeCardName(name: string) {
  return name.trim().toLowerCase()
}

function normalizeBanStatus(status: BanStatus, maxCopies: number | null): { status: BanStatus; maxCopies: number } {
  if (status === 'banned') {
    return { status, maxCopies: 0 }
  }

  if (status === 'limited-1') {
    return { status, maxCopies: 1 }
  }

  if (status === 'limited-2') {
    return { status, maxCopies: 2 }
  }

  return { status, maxCopies: maxCopies ?? 3 }
}

function stricterEntry(
  current: { cardName: string; status: BanStatus; maxCopies: number } | undefined,
  next: { cardName: string; status: BanStatus; maxCopies: number },
) {
  if (!current) return next
  return next.maxCopies < current.maxCopies ? next : current
}

export async function getBanlistRulesForFormat(format: FormatType) {
  const supabase = getSupabaseClient()
  const formatsToLoad: FormatType[] = format === 'Triadas' ? ['Imperio Racial', 'Triadas'] : [format]

  const { data, error } = await supabase
    .from('banlist_entries')
    .select('card_name, format, status, max_copies')
    .in('format', formatsToLoad)

  if (error) {
    throw error
  }

  const rules = new Map<string, { cardName: string; status: BanStatus; maxCopies: number }>()

  ;((data || []) as BanlistDbEntry[]).forEach((entry) => {
    const normalized = normalizeCardName(entry.card_name)
    const normalizedRule = normalizeBanStatus(entry.status, entry.max_copies)

    rules.set(normalized, stricterEntry(rules.get(normalized), {
      cardName: entry.card_name,
      status: normalizedRule.status,
      maxCopies: normalizedRule.maxCopies,
    }))
  })

  return rules
}

export async function auditExpandedDeckAgainstBanlist(
  deck: DeckLikeForAudit,
  cards: ExpandedDeckEntry[],
  sideboard: ExpandedDeckEntry[],
): Promise<DeckBanlistAuditResult> {
  const format = normalizeDeckFormat(deck.format)
  const rules = await getBanlistRulesForFormat(format)
  const cardCounts = new Map<string, {
    cardName: string
    quantity: number
    zones: Set<DeckBanlistIssueZone>
  }>()

  const addEntries = (entries: ExpandedDeckEntry[], zone: DeckBanlistIssueZone) => {
    entries.forEach((entry) => {
      if (!entry.card?.name) return

      const key = normalizeCardName(entry.card.name)
      const current = cardCounts.get(key) || {
        cardName: entry.card.name,
        quantity: 0,
        zones: new Set<DeckBanlistIssueZone>(),
      }

      current.quantity += entry.quantity
      current.zones.add(zone)
      cardCounts.set(key, current)
    })
  }

  addEntries(cards, 'main')
  addEntries(sideboard, 'sideboard')

  const issues: DeckBanlistIssue[] = []

  cardCounts.forEach((countedCard, normalizedName) => {
    const rule = rules.get(normalizedName)
    if (!rule) return

    if (rule.status === 'banned' || countedCard.quantity > rule.maxCopies) {
      issues.push({
        cardName: countedCard.cardName,
        status: rule.status,
        maxCopies: rule.maxCopies,
        actualCopies: countedCard.quantity,
        zones: Array.from(countedCard.zones),
      })
    }
  })

  issues.sort((a, b) => a.cardName.localeCompare(b.cardName))

  return {
    status: issues.length > 0 ? 'invalid' : 'valid',
    issues,
    checkedAt: new Date().toISOString(),
  }
}

export async function persistDeckBanlistAudit(deckId: string, audit: DeckBanlistAuditResult) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('decks')
    .update({
      banlist_status: audit.status,
      banlist_issues: audit.issues,
      banlist_checked_at: audit.checkedAt,
    })
    .eq('id', deckId)

  if (error) {
    console.error('Error persisting deck banlist audit:', error)
  }
}

export async function auditAndPersistExpandedDeck(
  deck: DeckLikeForAudit & { id: string },
  cards: ExpandedDeckEntry[],
  sideboard: ExpandedDeckEntry[],
) {
  const audit = await auditExpandedDeckAgainstBanlist(deck, cards, sideboard)
  await persistDeckBanlistAudit(deck.id, audit)
  return audit
}

export function getUncheckedDeckBanlistAudit(): DeckBanlistAuditResult {
  return {
    status: 'unchecked',
    issues: [],
    checkedAt: '',
  }
}

export { FORMATS as BANLIST_AUDIT_FORMATS }
