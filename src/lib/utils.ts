/**
 * Normaliza un string eliminando tildes y acentos para búsquedas insensibles a acentos
 * @param str String a normalizar
 * @returns String normalizado sin tildes ni acentos
 */
export function normalizeString(str: string): string {
  if (!str) return ''
  
  return str
    .toLowerCase()
    .normalize('NFD') // Descompone los caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (tildes, acentos)
}

/**
 * Verifica si un string contiene otro string, ignorando tildes y acentos
 * @param text Texto donde buscar
 * @param search Término de búsqueda
 * @returns true si el texto contiene el término de búsqueda (ignorando tildes)
 */
export function includesIgnoreAccents(text: string, search: string): boolean {
  if (!text || !search) return false
  return normalizeString(text).includes(normalizeString(search))
}
