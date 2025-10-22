import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { readdirSync } from 'fs'

// Cargar variables de entorno (intenta .env.local primero, luego .env)
config({ path: '.env.local' })
config({ path: '.env' })

// Validar que existen las variables de entorno necesarias
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas')
  console.error('Por favor, crea un archivo .env.local con:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key')
  console.error('  (o NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeo de tipos del Excel a la base de datos
const typeMapping: { [key: string]: string } = {
  'Talismán': 'TALISMAN',
  'Talisman': 'TALISMAN',
  'talisman': 'TALISMAN',
  'talismán': 'TALISMAN',
  'Arma': 'ARMA',
  'arma': 'ARMA',
  'Tótem': 'TOTEM',
  'Totem': 'TOTEM',
  'totem': 'TOTEM',
  'tótem': 'TOTEM',
  'Aliado': 'ALIADO',
  'aliado': 'ALIADO',
  'Oro': 'ORO',
  'oro': 'ORO'
}

// Mapeo de rarezas del Excel a la base de datos
const rarityMapping: { [key: string]: string } = {
  'Vasallo': 'VASALLO',
  'vasallo': 'VASALLO',
  'Cortesano': 'CORTESANO',
  'cortesano': 'CORTESANO',
  'Real': 'REAL',
  'real': 'REAL',
  'Mega Real': 'MEGA_REAL',
  'mega real': 'MEGA_REAL',
  'MegaReal': 'MEGA_REAL',
  'Ultra Real': 'ULTRA_REAL',
  'ultra real': 'ULTRA_REAL',
  'UltraReal': 'ULTRA_REAL',
  'Legendaria': 'LEGENDARIA',
  'legendaria': 'LEGENDARIA',
  'Promo': 'PROMO',
  'promo': 'PROMO',
  'Secreta': 'SECRETA',
  'secreta': 'SECRETA'
}

// Mapeo de nombres de carpetas de expansión
const folderMapping: { [key: string]: string } = {
  'Cenizas de Fuego': 'cenizas_de_fuego',
  'Espiritu Samurai': 'espiritu_samurai',
  'Hielo Inmortal': 'hielo_inmortal',
  'Giger': 'giger',
  'Secretos Arcanos': 'secretos_arcanos',
  'Zodiaco': 'zodiaco',
  'Lootbox 2024': 'lootbox_2024',
  'Raciales Imp 2024': 'raciales_imp_2024',
  'Amenaza Kaiju': 'amenazakaiju',
  'Bestiarium': 'bestiarium',
  'Escuadron Mecha': 'escuadronmecha',
  'Napoleon': 'napoleon',
  'Onyria': 'onyria',
  'Libertadores': 'libertadores'
}

// Normalizar texto (quitar acentos, convertir a minúsculas)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
}

async function clearDatabase() {
  console.log('🧹 Limpiando base de datos...')
  
  try {
    // Primero borrar deck_cards (tiene foreign keys)
    const { error: deckCardsError } = await supabase
      .from('deck_cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Borra todos

    if (deckCardsError) {
      console.log(`   ❌ Error borrando deck_cards: ${deckCardsError.message}`)
    } else {
      console.log('   ✅ deck_cards limpiado')
    }

    // Luego borrar cards
    const { error: cardsError } = await supabase
      .from('cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Borra todos

    if (cardsError) {
      console.log(`   ❌ Error borrando cards: ${cardsError.message}`)
    } else {
      console.log('   ✅ cards limpiado')
    }

    // Opcionalmente borrar decks también
    const { error: decksError } = await supabase
      .from('decks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Borra todos

    if (decksError) {
      console.log(`   ❌ Error borrando decks: ${decksError.message}`)
    } else {
      console.log('   ✅ decks limpiado')
    }

    console.log('✅ Base de datos limpiada correctamente\n')
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error)
    throw error
  }
}

async function importExcelData() {
  console.log('🚀 Iniciando importación de datos Excel...')

  const excelDir = 'D:/Proyectos/weas-mias/datos'
  const files = readdirSync(excelDir).filter(file => file.endsWith('.xlsx'))

  console.log(`📦 Encontrados ${files.length} archivos Excel\n`)

  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const file of files) {
    console.log(`📄 Procesando: ${file}`)

    try {
      const filePath = join(excelDir, file)
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log(`   📊 Encontradas ${jsonData.length} filas en ${sheetName}`)

      let imported = 0
      let skipped = 0

      for (const row of jsonData as any[]) {
        try {
          // Extraer datos del Excel (múltiples formatos posibles)
          let name = row['name'] || row['Nombre'] || row['nombre'] || ''
          let type = row['type'] || row['Tipo'] || row['tipo'] || ''
          let cost = row['cost'] || row['Coste'] || row['coste'] || null
          let attack = row['damage'] || row['Ataque'] || row['ataque'] || row['attack'] || null
          let defense = row['Defensa'] || row['defensa'] || row['defense'] || null
          let description = row['ability'] || row['Habilidad'] || row['Descripcion'] || row['habilidad'] || row['descripcion'] || row['description'] || row['flavour'] || ''
          let rarity = row['rarity'] || row['Rareza'] || row['rareza'] || ''
          let expansion = row['edition'] || row['Expansion'] || row['Edicion'] || row['expansion'] || row['edicion'] || ''
          let edid = row['edid'] || row['Edid'] || row['ID'] || row['id'] || ''

          // Para archivos con estructura de "edition" numérica, buscar el nombre de expansión
          if (typeof expansion === 'number' || /^\d+$/.test(expansion)) {
            // Extraer del nombre del archivo
            const fileNameLower = file.toLowerCase()
            if (fileNameLower.includes('cenizas_de_fuego') || fileNameLower.includes('cenizas')) expansion = 'Cenizas de Fuego'
            else if (fileNameLower.includes('espiritu_samurai') || fileNameLower.includes('samurai')) expansion = 'Espiritu Samurai'
            else if (fileNameLower.includes('hielo_inmortal') || fileNameLower.includes('hielo')) expansion = 'Hielo Inmortal'
            else if (fileNameLower.includes('giger')) expansion = 'Giger'
            else if (fileNameLower.includes('secretos_arcanos') || fileNameLower.includes('secretos')) expansion = 'Secretos Arcanos'
            else if (fileNameLower.includes('zodiaco')) expansion = 'Zodiaco'
            else if (fileNameLower.includes('lootbox_2024') || fileNameLower.includes('lootbox')) expansion = 'Lootbox 2024'
            else if (fileNameLower.includes('raciales_imp_2024') || fileNameLower.includes('raciales')) expansion = 'Raciales Imp 2024'
            else if (fileNameLower.includes('amenazakaiju') || fileNameLower.includes('amenaza')) expansion = 'Amenaza Kaiju'
            else if (fileNameLower.includes('bestiarium')) expansion = 'Bestiarium'
            else if (fileNameLower.includes('escuadronmecha') || fileNameLower.includes('escuadron') || fileNameLower.includes('mecha')) expansion = 'Escuadron Mecha'
            else if (fileNameLower.includes('napoleon')) expansion = 'Napoleon'
            else if (fileNameLower.includes('onyria')) expansion = 'Onyria'
            else if (fileNameLower.includes('libertadores')) expansion = 'Libertadores'
          }

          // Corregir rarezas secretas basadas en el slug o edid
          let edid_slug = row['slug'] || row['edid'] || edid
          if (edid_slug && typeof edid_slug === 'string' && edid_slug.includes('_secreta')) {
            rarity = 'Secreta'
          }

          // Para tipo "Oro", el coste debe ser null
          if (type && normalizeString(type) === 'oro') {
            cost = null
          }

          // Validar datos requeridos
          if (!name || !type || !rarity || !expansion) {
            console.log(`   ⚠️  Fila incompleta saltada - Nombre: "${name}", Tipo: "${type}", Rareza: "${rarity}", Exp: "${expansion}"`)
            skipped++
            continue
          }

          // Convertir tipos (normalizar primero para manejar acentos)
          const dbType = typeMapping[type] || typeMapping[normalizeString(type)] || 'ALIADO'
          const dbRarity = rarityMapping[rarity] || rarityMapping[normalizeString(rarity)] || 'VASALLO'
          const folderName = folderMapping[expansion] || expansion.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

          // El edid es el número de la imagen (ej: 001.png)
          // Si no hay edid, intentamos extraerlo del slug o usar un valor por defecto
          let imageNumber = '001'
          if (edid && !isNaN(Number(edid))) {
            imageNumber = edid.toString().padStart(3, '0')
          } else if (edid_slug && typeof edid_slug === 'string') {
            // Intentar extraer número del slug (ej: "001" de "001_secreta")
            const match = edid_slug.match(/^(\d+)/)
            if (match) {
              imageNumber = match[1].padStart(3, '0')
            }
          }

          const imageFile = `${imageNumber}.png`
          const imageUrl = `/cards/${folderName}/${imageFile}`

          // Insertar en Supabase
          const { data, error } = await supabase
            .from('cards')
            .insert({
              name: name.trim(),
              type: dbType,
              cost: cost !== null && cost !== '' ? parseInt(cost) : null,
              attack: attack !== null && attack !== '' ? parseInt(attack) : null,
              defense: defense !== null && defense !== '' ? parseInt(defense) : null,
              description: description ? description.trim() : null,
              image_url: imageUrl,
              image_file: imageFile,
              rarity: dbRarity,
              expansion: expansion.trim(),
              is_active: true
            })
            .select()

          if (error) {
            console.log(`   ❌ Error insertando "${name}": ${error.message}`)
            totalErrors++
          } else {
            imported++
            if (imported <= 3) {
              // Mostrar solo las primeras 3 para no saturar la consola
              console.log(`   ✅ ${name} (${dbType}, ${dbRarity}) - ${imageFile}`)
            }
          }

        } catch (rowError) {
          console.log(`   ❌ Error procesando fila: ${rowError}`)
          totalErrors++
        }
      }

      console.log(`   📊 Importadas ${imported} cartas, saltadas ${skipped} de ${file}`)
      totalImported += imported
      totalSkipped += skipped
      console.log('') // Línea en blanco para separar archivos

    } catch (fileError) {
      console.log(`   ❌ Error procesando ${file}: ${fileError}`)
      console.log('') // Línea en blanco
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🎉 IMPORTACIÓN COMPLETADA`)
  console.log(`${'='.repeat(60)}`)
  console.log(`✅ Cartas importadas: ${totalImported}`)
  console.log(`⚠️  Filas saltadas: ${totalSkipped}`)
  console.log(`❌ Errores: ${totalErrors}`)
  console.log(`${'='.repeat(60)}\n`)
}

async function main() {
  try {
    console.log('\n' + '='.repeat(60))
    console.log('🔄 RESET E IMPORTACIÓN COMPLETA DE CARTAS')
    console.log('='.repeat(60) + '\n')

    // Paso 1: Limpiar base de datos
    await clearDatabase()

    // Paso 2: Importar todos los datos
    await importExcelData()

    console.log('✅ Proceso completado exitosamente!')
  } catch (error) {
    console.error('❌ Error en el proceso:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

export { main, clearDatabase, importExcelData }

