/**
 * Helper para generar URLs de imágenes con CDN
 * Soporta múltiples CDNs (Bunny.net, Cloudflare, etc.)
 */

export function getCardImageUrl(imagePath: string): string {
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL
  
  // Si no hay CDN configurado, usar ruta local
  if (!cdnUrl) {
    return imagePath
  }
  
  // Limpiar la ruta (remover slash inicial si existe)
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  
  // Construir URL completa del CDN
  return `${cdnUrl}/${cleanPath}`
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

