import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Carpeta donde están los archivos Excel
const dataFolder = process.env.DATA_FOLDER || 'D:\\Proyectos\\weas-mias\\datos' || path.join(process.cwd(), 'data')

// Mapeo de expansiones a rutas de carpetas (debe coincidir con cdn.ts)
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
  'Zodiaco': '/cards/zodiaco/',
  'Kaiju VS Mecha: Titanes': '/cards/kvsm_titanes/'
}

interface CardRow {
  name?: string
  Name?: string
  NOMBRE?: string
  nombre?: string
  expansion?: string
  Expansion?: string
  EXPANSION?: string
  edition?: string
  Edition?: string
  EDITION?: string
  edid?: string | number
  Edid?: string | number
  EDID?: string | number
  EdId?: string | number
  image_file?: string
  ImageFile?: string
  IMAGE_FILE?: string
  imageFile?: string
  image_url?: string
  ImageUrl?: string
  IMAGE_URL?: string
  imageUrl?: string
}

// Normalizar nombre de expansión para que coincida con el mapeo
function normalizeExpansion(expansion: string): string {
  const trimmed = expansion.trim()
  
  // Mapeo de nombres comunes del Excel a nombres en la base de datos
  const expansionMap: Record<string, string> = {
    'Amenazakaiju': 'Amenaza Kaiju',
    'Escuadronmecha': 'Escuadron Mecha',
    'Espiritu Samurai 100 Completo Final': 'Espiritu Samurai',
    'Espiritu Samurai': 'Espiritu Samurai',
    'Kvsm Titanes': 'Kaiju VS Mecha: Titanes',
    'Kaiju VS Mecha: Titanes': 'Kaiju VS Mecha: Titanes',
    'Toolkit Cenizas De Fuego': 'Cenizas de Fuego',
    'Toolkit Hielo Inmortal': 'Hielo Inmortal',
  }
  
  // Si hay un mapeo directo, usarlo
  if (expansionMap[trimmed]) {
    return expansionMap[trimmed]
  }
  
  // Si ya está en el mapeo EXPANSION_TO_PATH, devolverlo tal cual
  if (EXPANSION_TO_PATH[trimmed]) {
    return trimmed
  }
  
  // Intentar normalizar: convertir "amenazakaiju" a "Amenaza Kaiju"
  // Esto es una heurística básica
  const normalized = trimmed
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insertar espacio antes de mayúsculas
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  // Si después de normalizar está en el mapeo, usarlo
  if (EXPANSION_TO_PATH[normalized]) {
    return normalized
  }
  
  // Si no, devolver el original
  return trimmed
}

// Normalizar nombre de carta
function normalizeCardName(name: string): string {
  return name.trim()
}

// Construir image_url desde edid (número de carta)
function buildImageUrl(edid: string | number | null | undefined, expansion: string): string | null {
  if (!edid && edid !== 0) return null

  const expansionPath = EXPANSION_TO_PATH[expansion]
  if (!expansionPath) {
    console.log(`   ⚠️  No hay mapeo para expansión: ${expansion}`)
    return null
  }

  // Convertir edid a número y luego a string con padding de 3 dígitos
  const edidNum = typeof edid === 'string' ? parseInt(edid, 10) : Number(edid)
  if (isNaN(edidNum)) {
    return null
  }

  // Formatear como 003.png, 012.png, etc.
  const fileName = edidNum.toString().padStart(3, '0') + '.png'
  
  // Construir ruta completa: /cards/[nombre_edicion]/003.png
  const fullPath = `${expansionPath}${fileName}`
  return fullPath.startsWith('/') ? fullPath : `/${fullPath}`
}

async function updateImageUrls() {
  console.log('🔄 Iniciando actualización de image_url desde Excel...\n')

  // Verificar que existe la carpeta
  if (!fs.existsSync(dataFolder)) {
    console.error(`❌ La carpeta "${dataFolder}" no existe.`)
    process.exit(1)
  }

  // Leer todos los archivos Excel
  const files = fs.readdirSync(dataFolder).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
  console.log(`📁 Encontrados ${files.length} archivos Excel\n`)

  if (files.length === 0) {
    console.log(`⚠️  No se encontraron archivos Excel en "${dataFolder}"`)
    process.exit(0)
  }

  // Mapa para almacenar nombre+expansión -> image_url
  const cardImageMap = new Map<string, string>()

  // PASO 1: Leer todos los Excel y construir el mapa
  console.log('📖 Leyendo archivos Excel...\n')
  for (const file of files) {
    console.log(`   Procesando: ${file}`)
    const filePath = path.join(dataFolder, file)
    
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: CardRow[] = XLSX.utils.sheet_to_json(worksheet)

      // Determinar el nombre de la expansión desde el nombre del archivo
      let defaultExpansion = file.replace(/datos_api_cartas_/i, '').replace(/\.xlsx?$/i, '').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      // Normalizar nombres especiales
      if (defaultExpansion.toLowerCase().includes('kvsm') || defaultExpansion.toLowerCase().includes('titanes')) {
        defaultExpansion = 'Kaiju VS Mecha: Titanes'
      }

      let fileCount = 0
      
      // Mostrar columnas disponibles en el primer archivo para debugging
      if (files.indexOf(file) === 0 && data.length > 0) {
        console.log(`   📋 Columnas disponibles: ${Object.keys(data[0]).join(', ')}`)
      }
      
      for (const row of data) {
        const name = row.name || row.Name || row.NOMBRE || row.nombre
        if (!name) continue

        // Prioridad: usar la columna "edition" del Excel, luego "expansion", luego el nombre del archivo
        let expansion = row.edition || row.Edition || row.EDITION || 
                       row.expansion || row.Expansion || row.EXPANSION
        if (!expansion || /^\d+$/.test(String(expansion))) {
          expansion = defaultExpansion
        }
        expansion = normalizeExpansion(expansion)

        // Buscar la columna edid (puede tener diferentes variantes)
        const edid = row.edid || row.Edid || row.EDID || row.EdId

        // Si hay image_url en el Excel, usarla directamente (prioridad)
        const imageUrl = row.image_url || row.ImageUrl || row.IMAGE_URL || row.imageUrl
        if (imageUrl && imageUrl.trim()) {
          const key = `${normalizeCardName(name)}|${expansion}`
          cardImageMap.set(key, imageUrl.trim())
          fileCount++
          continue
        }

        // Si hay edid, construir la URL usando edid
        if (edid !== null && edid !== undefined && edid !== '') {
          const builtUrl = buildImageUrl(edid, expansion)
          if (builtUrl) {
            const key = `${normalizeCardName(name)}|${expansion}`
            cardImageMap.set(key, builtUrl)
            fileCount++
          }
        }
      }

      console.log(`   ✅ ${fileCount} cartas procesadas\n`)
    } catch (error: any) {
      console.log(`   ❌ Error leyendo archivo: ${error.message || error}\n`)
    }
  }

  console.log(`📊 Total de cartas en mapa: ${cardImageMap.size}\n`)

  // PASO 2: Obtener todas las cartas con image_url null/vacío
  console.log('🔍 Buscando cartas con image_url null/vacío...\n')
  
  const { data: cardsWithoutImage, error: fetchError } = await supabase
    .from('cards')
    .select('id, name, expansion, image_url')
    .or('image_url.is.null,image_url.eq.,image_url.eq.null')

  if (fetchError) {
    console.error(`❌ Error obteniendo cartas: ${fetchError.message}`)
    process.exit(1)
  }

  if (!cardsWithoutImage || cardsWithoutImage.length === 0) {
    console.log('✅ No hay cartas sin image_url')
    process.exit(0)
  }

  console.log(`📋 Encontradas ${cardsWithoutImage.length} cartas sin image_url\n`)

  // PASO 3: Actualizar cartas
  console.log('🔄 Actualizando cartas...\n')
  
  let updated = 0
  let notFound = 0
  let errors = 0

  for (const card of cardsWithoutImage) {
    const key = `${normalizeCardName(card.name)}|${normalizeExpansion(card.expansion)}`
    const imageUrl = cardImageMap.get(key)

    if (imageUrl) {
      try {
        const { error: updateError } = await supabase
          .from('cards')
          .update({ image_url: imageUrl })
          .eq('id', card.id)

        if (updateError) {
          console.log(`   ❌ Error actualizando "${card.name}" (${card.expansion}): ${updateError.message}`)
          errors++
        } else {
          console.log(`   ✅ Actualizada: "${card.name}" (${card.expansion}) -> ${imageUrl}`)
          updated++
        }
      } catch (error: any) {
        console.log(`   ❌ Error procesando "${card.name}": ${error.message || error}`)
        errors++
      }
    } else {
      console.log(`   ⚠️  No encontrada en Excel: "${card.name}" (${card.expansion})`)
      notFound++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN FINAL')
  console.log('='.repeat(50))
  console.log(`✅ Actualizadas: ${updated}`)
  console.log(`⚠️  No encontradas en Excel: ${notFound}`)
  console.log(`❌ Errores: ${errors}`)
  console.log('='.repeat(50) + '\n')
}

// Ejecutar
updateImageUrls()
  .then(() => {
    console.log('✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
