/**
 * Helper para generar URLs de imágenes con CDN
 * Soporta múltiples CDNs (Bunny.net, Cloudflare, etc.)
 */

// Mapeo de expansiones a rutas de carpetas
const EXPANSION_TO_PATH: Record<string, string> = {
  'Amenaza Kaiju': '/cards/amenazakaiju/',
  'Bestiarium': '/cards/bestiarium/',
  'Cenizas de Fuego': '/cards/cenizas_de_fuego/',
  'Escuadron Mecha': '/cards/escuadronmecha/',
  'Espiritu Samurai': '/cards/espiritu_samurai/',
  'Giger': '/cards/giger/',
  'Hielo Inmortal': '/cards/hielo_inmortal/',
  'Libertadores': '/cards/libertadores/',
  'Lootbox 2024': '/cards/lootbox_2024/',
  'Napoleon': '/cards/napoleon/',
  'Onyria': '/cards/onyria/',
  'Raciales Imp 2024': '/cards/raciales_imp_2024/',
  'Secretos Arcanos': '/cards/secretos_arcanos/',
  'Zodiaco': '/cards/zodiaco/'
}

export function getCardImageUrl(imageFile: string, expansion?: string): string {
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL
  
  // Si se proporciona expansión, construir la ruta completa
  let fullPath = imageFile
  if (expansion && EXPANSION_TO_PATH[expansion]) {
    // Si imageFile no incluye la carpeta, agregarla
    if (!imageFile.includes('/cards/')) {
      fullPath = `${EXPANSION_TO_PATH[expansion]}${imageFile}`
    }
  }
  
  // Si no hay CDN configurado, usar ruta local
  if (!cdnUrl) {
    return fullPath
  }
  
  // Limpiar la ruta (remover slash inicial si existe)
  const cleanPath = fullPath.startsWith('/') ? fullPath.slice(1) : fullPath
  
  // Convertir la extensión a .webp si es una imagen
  const webpPath = cleanPath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
  
  // Construir URL completa del CDN
  return `${cdnUrl}/${webpPath}`
}

/**
 * Obtener URL de imagen con optimizaciones de Bunny.net
 */
export function getOptimizedCardImageUrl(
  imagePath: string, 
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'png' | 'jpeg'
  }
): string {
  const baseUrl = getCardImageUrl(imagePath)
  
  // Si no hay opciones o no es Bunny CDN, devolver URL base
  if (!options || !process.env.NEXT_PUBLIC_BUNNY_CDN_URL) {
    return baseUrl
  }
  
  const params = new URLSearchParams()
  
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.quality) params.append('quality', options.quality.toString())
  if (options.format) params.append('format', options.format)
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Obtener thumbnail de carta (optimizado para listas)
 */
export function getCardThumbnailUrl(imagePath: string): string {
  return getOptimizedCardImageUrl(imagePath, {
    width: 200,
    quality: 85,
    format: 'webp'
  })
}

/**
 * Obtener imagen de carta de tamaño completo (optimizado para vista detalle)
 */
export function getCardFullImageUrl(imagePath: string): string {
  return getOptimizedCardImageUrl(imagePath, {
    width: 600,
    quality: 90,
    format: 'webp'
  })
}

