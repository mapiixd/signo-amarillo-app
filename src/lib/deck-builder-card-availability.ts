export const DECK_BUILDER_EXCLUDED_EXPANSIONS = ['Zodiaco', 'Amenaza Kaiju'] as const

const excludedExpansions = new Set<string>(DECK_BUILDER_EXCLUDED_EXPANSIONS)

export function isDeckBuilderCardAvailable(item: { expansion?: string; name?: string }): boolean {
  const expansion = item.expansion ?? item.name
  return !expansion || !excludedExpansions.has(expansion)
}
