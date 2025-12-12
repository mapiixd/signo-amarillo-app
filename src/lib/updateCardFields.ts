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
  ability?: string
  Ability?: string
  ABILITY?: string
  damage?: string | number
  Damage?: string | number
  DAMAGE?: string | number
}

// Mapeo de expansiones a rutas de carpetas (igual que en updateImageUrls.ts)
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

// Construir image_url desde edid (igual que en updateImageUrls.ts)
function buildImageUrlFromEdid(edid: string | number | null | undefined, expansion: string): string | null {
  if (!edid && edid !== 0) return null

  const expansionPath = EXPANSION_TO_PATH[expansion]
  if (!expansionPath) {
    return null
  }

  const edidNum = typeof edid === 'string' ? parseInt(edid, 10) : Number(edid)
  if (isNaN(edidNum)) {
    return null
  }

  const fileName = edidNum.toString().padStart(3, '0') + '.png'
  const fullPath = `${expansionPath}${fileName}`
  return fullPath.startsWith('/') ? fullPath : `/${fullPath}`
}

// Normalizar nombre de expansión
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
  
  if (expansionMap[trimmed]) {
    return expansionMap[trimmed]
  }
  
  return trimmed
}

// Normalizar nombre de carta
function normalizeCardName(name: string): string {
  return name.trim()
}

// Convertir a número o null
function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? null : num
}

async function updateCardFields() {
  console.log('🔄 Iniciando actualización de description y attack desde Excel...\n')

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

  // Mapa para almacenar edid+expansión -> { description, attack, image_url }
  // También mapa por nombre+expansión como fallback
  const cardFieldsMapByEdid = new Map<string, { description: string | null, attack: number | null, image_url: string | null }>()
  const cardFieldsMapByName = new Map<string, { description: string | null, attack: number | null }>()

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
      if (defaultExpansion.toLowerCase().includes('espiritu') && defaultExpansion.toLowerCase().includes('samurai')) {
        defaultExpansion = 'Espiritu Samurai'
      }
      if (defaultExpansion.toLowerCase().includes('napoleon')) {
        defaultExpansion = 'Napoleon'
      }
      if (defaultExpansion.toLowerCase().includes('toolkit')) {
        // Los toolkit tienen el nombre de la expansión en el nombre del archivo
        if (defaultExpansion.toLowerCase().includes('cenizas')) {
          defaultExpansion = 'Cenizas de Fuego'
        } else if (defaultExpansion.toLowerCase().includes('hielo')) {
          defaultExpansion = 'Hielo Inmortal'
        }
      }

      let fileCount = 0
      
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

        // Extraer edid, ability (description) y damage (attack)
        const edid = row.edid || row.Edid || row.EDID || row.EdId || null
        const ability = row.ability || row.Ability || row.ABILITY || null
        const damage = row.damage || row.Damage || row.DAMAGE || null

        // Normalizar description: si está vacío o es solo espacios, usar null
        const description = ability && ability.toString().trim() ? ability.toString().trim() : null
        
        // Convertir damage a número
        const attack = toNumber(damage)

        // Construir image_url desde edid
        const image_url = buildImageUrlFromEdid(edid, expansion)

        // Guardar en el mapa por edid (si existe)
        if (edid !== null && edid !== undefined && edid !== '') {
          const edidKey = `${edid}|${expansion}`
          cardFieldsMapByEdid.set(edidKey, { description, attack, image_url })
        }

        // También guardar por nombre+expansión como fallback
        const nameKey = `${normalizeCardName(name)}|${expansion}`
        cardFieldsMapByName.set(nameKey, { description, attack })
        
        fileCount++
      }

      console.log(`   ✅ ${fileCount} cartas procesadas\n`)
    } catch (error: any) {
      console.log(`   ❌ Error leyendo archivo: ${error.message || error}\n`)
    }
  }

  console.log(`📊 Total de cartas en mapa por edid: ${cardFieldsMapByEdid.size}`)
  console.log(`📊 Total de cartas en mapa por nombre: ${cardFieldsMapByName.size}\n`)

  // PASO 3: Obtener cartas que necesitan actualización (description null)
  console.log('🔍 Buscando cartas con description null...\n')
  
  const { data: cardsWithNullDescription, error: nullFetchError } = await supabase
    .from('cards')
    .select('id, name, expansion, description, attack')
    .or('description.is.null,description.eq.')

  if (nullFetchError) {
    console.error(`❌ Error obteniendo cartas con description null: ${nullFetchError.message}`)
    process.exit(1)
  }

  const cardsToUpdate = cardsWithNullDescription || []
  console.log(`📋 Encontradas ${cardsToUpdate.length} cartas con description null/vacío\n`)

  // PASO 4: Actualizar cartas
  console.log('🔄 Actualizando cartas...\n')
  
  let updated = 0
  let notFound = 0
  let errors = 0
  let skipped = 0
  let matchedByEdid = 0
  let matchedByName = 0
  const notFoundExamples: Array<{ name: string, expansion: string, image_url: string | null }> = []

  for (const card of cardsToUpdate) {
    let fields: { description: string | null, attack: number | null } | null = null
    let matched = false

    // PRIORIDAD 1: Buscar por image_url (que corresponde al edid)
    if (card.image_url) {
      // Buscar en el mapa por edid usando el image_url
      for (const [edidKey, edidFields] of cardFieldsMapByEdid.entries()) {
        if (edidFields.image_url === card.image_url) {
          fields = { description: edidFields.description, attack: edidFields.attack }
          matched = true
          matchedByEdid++
          break
        }
      }
    }

    // PRIORIDAD 2: Buscar por nombre+expansión
    if (!fields) {
      const nameKey = `${normalizeCardName(card.name)}|${normalizeExpansion(card.expansion)}`
      fields = cardFieldsMapByName.get(nameKey) || null
      
      if (fields) {
        matched = true
        matchedByName++
      }
    }

    // PRIORIDAD 3: Búsqueda flexible por nombre
    if (!fields) {
      const cardNameNorm = normalizeCardName(card.name).toLowerCase().trim()
      const cardExpNorm = normalizeExpansion(card.expansion).toLowerCase().trim()
      
      for (const [mapKey, mapFields] of cardFieldsMapByName.entries()) {
        const [mapName, mapExpansion] = mapKey.split('|')
        const mapNameNorm = mapName.toLowerCase().trim()
        const mapExpNorm = mapExpansion.toLowerCase().trim()
        
        if (cardNameNorm === mapNameNorm && cardExpNorm === mapExpNorm) {
          fields = mapFields
          matched = true
          matchedByName++
          break
        }
      }
    }
    
    // Si aún no se encuentra, guardar ejemplo para debugging
    if (!fields && notFoundExamples.length < 10) {
      notFoundExamples.push({ 
        name: card.name, 
        expansion: card.expansion,
        image_url: card.image_url 
      })
    }

    if (fields) {
      // Determinar qué campos actualizar
      const updates: { description?: string | null, attack?: number | null } = {}
      let needsUpdate = false

      // Normalizar description de la carta (null o vacío se consideran iguales)
      const cardDescription = card.description && card.description.trim() ? card.description.trim() : null
      
      // Actualizar description si:
      // 1. La carta tiene null/vacío Y el Excel tiene un valor, O
      // 2. Ambos tienen valores pero son diferentes
      if (fields.description !== null) {
        if (cardDescription === null || cardDescription !== fields.description) {
          updates.description = fields.description
          needsUpdate = true
        }
      }

      // Actualizar attack si:
      // 1. La carta tiene null Y el Excel tiene un valor, O
      // 2. Ambos tienen valores pero son diferentes
      if (fields.attack !== null) {
        if (card.attack === null || card.attack !== fields.attack) {
          updates.attack = fields.attack
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        try {
          const { error: updateError } = await supabase
            .from('cards')
            .update(updates)
            .eq('id', card.id)

          if (updateError) {
            console.log(`   ❌ Error actualizando "${card.name}" (${card.expansion}): ${updateError.message}`)
            errors++
          } else {
            const changes = []
            if (updates.description !== undefined) changes.push(`description`)
            if (updates.attack !== undefined) changes.push(`attack`)
            console.log(`   ✅ Actualizada: "${card.name}" (${card.expansion}) - ${changes.join(', ')}`)
            updated++
          }
        } catch (error: any) {
          console.log(`   ❌ Error procesando "${card.name}": ${error.message || error}`)
          errors++
        }
      } else {
        skipped++
      }
    } else {
      notFound++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN FINAL')
  console.log('='.repeat(50))
  console.log(`✅ Actualizadas: ${updated}`)
  console.log(`⏭️  Sin cambios necesarios: ${skipped}`)
  console.log(`⚠️  No encontradas en Excel: ${notFound}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`\n🔍 Matching:`)
  console.log(`   Por edid/image_url: ${matchedByEdid}`)
  console.log(`   Por nombre+expansión: ${matchedByName}`)
  
  if (notFoundExamples.length > 0) {
    console.log('\n📝 Ejemplos de cartas no encontradas:')
    notFoundExamples.forEach(ex => {
      console.log(`   - "${ex.name}" (${ex.expansion}) - image_url: ${ex.image_url || 'null'}`)
    })
  }
  
  console.log('='.repeat(50) + '\n')
}

// Ejecutar
updateCardFields()
  .then(() => {
    console.log('✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
