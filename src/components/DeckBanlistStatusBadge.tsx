import type { DeckBanlistIssue, DeckBanlistStatus } from '@/types'

interface DeckBanlistStatusBadgeProps {
  status?: DeckBanlistStatus | null
  issues?: DeckBanlistIssue[] | null
  checkedAt?: string | null
  compact?: boolean
}

export function DeckBanlistStatusBadge({
  status,
  issues,
  checkedAt,
  compact = false,
}: DeckBanlistStatusBadgeProps) {
  const issueCount = issues?.length || 0
  const sizeClass = compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'

  if (status === 'invalid') {
    return (
      <span
        className={`inline-flex w-fit items-center rounded-full border border-red-500/40 bg-red-950/40 font-semibold uppercase tracking-[0.16em] text-red-200 ${sizeClass}`}
        title={checkedAt ? `Revisado: ${new Date(checkedAt).toLocaleString('es-CL')}` : undefined}
      >
        Revisar banlist{issueCount > 0 ? ` (${issueCount})` : ''}
      </span>
    )
  }

  if (status === 'valid') {
    return (
      <span
        className={`inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-950/30 font-semibold uppercase tracking-[0.16em] text-emerald-200 ${sizeClass}`}
        title={checkedAt ? `Revisado: ${new Date(checkedAt).toLocaleString('es-CL')}` : undefined}
      >
        Banlist vigente
      </span>
    )
  }

  return (
    <span className={`inline-flex w-fit items-center rounded-full border border-[#2D9B96]/40 bg-[#0A0E1A] font-semibold uppercase tracking-[0.16em] text-[#A0A0A0] ${sizeClass}`}>
      Sin revisar
    </span>
  )
}