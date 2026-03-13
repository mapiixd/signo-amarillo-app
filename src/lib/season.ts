/**
 * Temporada actual del juego. Los mazos se crean asociados a esta temporada
 * para poder filtrar por rotación de cartas en el futuro.
 * Actualizar este valor cuando comience una nueva temporada.
 */
export const CURRENT_SEASON = 'KvM: Titanes'

export function getCurrentSeason(): string {
  return CURRENT_SEASON
}
