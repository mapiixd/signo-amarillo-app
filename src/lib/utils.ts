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

/**
 * Formatea una fecha ISO (UTC) a formato local
 * Convierte la fecha UTC a la zona horaria local del usuario para mostrar la fecha correcta
 * @param isoDateString Fecha en formato ISO (ej: "2024-12-30T02:00:00Z" o "2024-12-30T02:00:00.000Z")
 * @returns Fecha formateada en formato español según la zona horaria local (ej: "29/12/2024")
 */
export function formatDate(isoDateString: string): string {
  if (!isoDateString) return ''
  
  try {
    // Crear objeto Date desde la cadena ISO
    // JavaScript automáticamente convierte UTC a la zona horaria local del navegador
    const date = new Date(isoDateString)
    
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', isoDateString)
      return ''
    }
    
    // Usar métodos LOCALES (no UTC) para extraer la fecha
    // Esto muestra la fecha según la zona horaria del usuario
    // Si un mazo fue creado el 29 a las 23:00 hora local, pero se guardó como 30 a las 02:00 UTC,
    // queremos mostrar el 29 (fecha local), no el 30 (fecha UTC)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() devuelve 0-11
    const day = date.getDate()
    
    // Formatear manualmente en formato español (DD/MM/YYYY)
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`
  } catch (error) {
    console.error('Error formateando fecha:', isoDateString, error)
    return ''
  }
}