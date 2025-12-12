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

export function getCardImageUrl(imageFile: string | null | undefined, expansion?: string): string | null {
  // Si imageFile es null, undefined o vacío, retornar null
  if (!imageFile || imageFile.trim() === '') {
    return null
  }
  
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL
  
  // Si imageFile ya es una URL completa (empieza con http), retornarla directamente
  if (imageFile.startsWith('http://') || imageFile.startsWith('https://')) {
    return imageFile
  }
  
  // Si imageFile ya es una ruta completa local (empieza con /cards/), manejarla
  if (imageFile.startsWith('/cards/')) {
    // Si no hay CDN configurado, retornar la ruta local directamente
    if (!cdnUrl) {
      return imageFile
    }
    // Si hay CDN, convertir a URL del CDN
    const cleanPath = imageFile.startsWith('/') ? imageFile.slice(1) : imageFile
    const webpPath = cleanPath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    return `${cdnUrl}/${webpPath}`
  }
  
  // Si se proporciona expansión, construir la ruta completa
  let fullPath = imageFile
  if (expansion && EXPANSION_TO_PATH[expansion]) {
    // Si imageFile no incluye la carpeta, agregarla
    if (!imageFile.includes('/cards/')) {
      fullPath = `${EXPANSION_TO_PATH[expansion]}${imageFile}`
    }
  } else if (!imageFile.includes('/cards/')) {
    // Si no hay expansión pero tampoco tiene ruta, retornar null
    return null
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
  imagePath: string | null | undefined, 
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'png' | 'jpeg'
  }
): string | null {
  const baseUrl = getCardImageUrl(imagePath)
  
  // Si no hay URL base, retornar null
  if (!baseUrl) {
    return null
  }
  
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
export function getCardThumbnailUrl(imagePath: string | null | undefined): string | null {
  return getOptimizedCardImageUrl(imagePath, {
    width: 200,
    quality: 85,
    format: 'webp'
  })
}

/**
 * Obtener imagen de carta de tamaño completo (optimizado para vista detalle)
 */
export function getCardFullImageUrl(imagePath: string | null | undefined): string | null {
  return getOptimizedCardImageUrl(imagePath, {
    width: 600,
    quality: 90,
    format: 'webp'
  })
}

