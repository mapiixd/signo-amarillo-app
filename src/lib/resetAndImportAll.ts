import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import * as readline from 'readline'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Carpeta donde están los archivos Excel
const dataFolder = path.join(process.cwd(), 'data')

interface CardRow {
  name?: string
  Name?: string
  NOMBRE?: string
  nombre?: string
  type?: string
  Type?: string
  TIPO?: string
  tipo?: string
  cost?: number | string
  Cost?: number | string
  COSTE?: number | string
  coste?: number | string
  attack?: number | string
  Attack?: number | string
  ATAQUE?: number | string
  ataque?: number | string
  defense?: number | string
  Defense?: number | string
  DEFENSA?: number | string
  defensa?: number | string
  description?: string
  Description?: string
  DESCRIPCION?: string
  descripcion?: string
  rarity?: string
  Rarity?: string
  RAREZA?: string
  rareza?: string
  expansion?: string
  Expansion?: string
  EXPANSION?: string
  edition?: string
  Edition?: string
  EDITION?: string
  race?: string
  Race?: string
  RAZA?: string
  raza?: string
  image_file?: string
  ImageFile?: string
  IMAGE_FILE?: string
  imageFile?: string
  image_url?: string
  ImageUrl?: string
  IMAGE_URL?: string
  imageUrl?: string
}

// Normalizar valores de tipo
function normalizeType(type: string | undefined): string | null {
  if (!type) return null
  const normalized = type.trim().toUpperCase()
  const typeMap: Record<string, string> = {
    'TALISMAN': 'TALISMAN',
    'TALISMÁN': 'TALISMAN',
    'ARMA': 'ARMA',
    'WEAPON': 'ARMA',
    'TOTEM': 'TOTEM',
    'TÓTEM': 'TOTEM',
    'ALIADO': 'ALIADO',
    'ALLY': 'ALIADO',
    'ORO': 'ORO',
    'GOLD': 'ORO'
  }
  return typeMap[normalized] || normalized
}

// Normalizar valores de rareza
function normalizeRarity(rarity: string | undefined): string | null {
  if (!rarity) return null
  const normalized = rarity.trim().toUpperCase()
  const rarityMap: Record<string, string> = {
    'VASALLO': 'VASALLO',
    'CORTESANO': 'CORTESANO',
    'REAL': 'REAL',
    'MEGA_REAL': 'MEGA_REAL',
    'MEGA REAL': 'MEGA_REAL',
    'ULTRA_REAL': 'ULTRA_REAL',
    'ULTRA REAL': 'ULTRA_REAL',
    'LEGENDARIA': 'LEGENDARIA',
    'LEGENDARIO': 'LEGENDARIA',
    'PROMO': 'PROMO',
    'SECRETA': 'SECRETA',
    'SECRETO': 'SECRETA'
  }
  return rarityMap[normalized] || normalized
}

// Convertir a número o null
function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? null : num
}

// Función para preguntar al usuario
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function resetAndImportAll() {
  console.log('⚠️  ADVERTENCIA: Este proceso eliminará TODAS las cartas existentes y las reemplazará con los datos de Excel.\n')
  
  const answer = await askQuestion('¿Estás seguro de que quieres continuar? (escribe "SI" para confirmar): ')
  
  if (answer.trim().toUpperCase() !== 'SI') {
    console.log('\n❌ Operación cancelada.')
    process.exit(0)
  }

  console.log('\n🔄 Iniciando reset e importación completa...\n')

  // Verificar que existe la carpeta
  if (!fs.existsSync(dataFolder)) {
    console.error(`❌ La carpeta "${dataFolder}" no existe.`)
    console.log(`\n💡 Crea la carpeta "data" en la raíz del proyecto y coloca allí los archivos Excel.`)
    process.exit(1)
  }

  // PASO 1: Eliminar todas las cartas existentes
  console.log('🗑️  Eliminando todas las cartas existentes...')
  try {
    // Primero obtener todas las cartas para eliminarlas
    const { data: allCards, error: fetchError } = await supabase
      .from('cards')
      .select('id')

    if (fetchError) {
      console.error(`❌ Error obteniendo cartas: ${fetchError.message}`)
      process.exit(1)
    }

    if (allCards && allCards.length > 0) {
      const ids = allCards.map(card => card.id)
      // Eliminar en lotes para evitar problemas con muchas cartas
      const batchSize = 1000
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)
        const { error: deleteError } = await supabase
          .from('cards')
          .delete()
          .in('id', batch)

        if (deleteError) {
          console.error(`❌ Error eliminando lote ${i / batchSize + 1}: ${deleteError.message}`)
          process.exit(1)
        }
      }
      console.log(`✅ ${allCards.length} cartas eliminadas\n`)
    } else {
      console.log('✅ No había cartas para eliminar\n')
    }
  } catch (error: any) {
    console.error(`❌ Error fatal al eliminar: ${error.message || error}`)
    process.exit(1)
  }

  // PASO 2: Importar desde Excel
  console.log('📥 Importando cartas desde Excel...\n')

  // Leer todos los archivos Excel
  const files = fs.readdirSync(dataFolder).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
  console.log(`📁 Encontrados ${files.length} archivos Excel\n`)

  if (files.length === 0) {
    console.log(`⚠️  No se encontraron archivos Excel en "${dataFolder}"`)
    console.log(`\n💡 Coloca los archivos Excel (.xlsx o .xls) en la carpeta "data"`)
    process.exit(0)
  }

  let totalCreated = 0
  let totalErrors = 0
  const expansionStats: Record<string, number> = {}

  for (const file of files) {
    console.log(`📖 Procesando: ${file}`)
    const filePath = path.join(dataFolder, file)
    
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: CardRow[] = XLSX.utils.sheet_to_json(worksheet)

      console.log(`   ├─ ${data.length} registros encontrados`)

      let fileCreated = 0
      let fileErrors = 0

      // Determinar el nombre de la expansión desde el nombre del archivo o primera fila
      let defaultExpansion = file.replace(/datos_api_cartas_/i, '').replace(/\.xlsx?$/i, '').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      // Si la primera fila tiene un nombre que parece ser el título de la expansión, usarlo
      if (data.length > 0 && data[0].name && (data[0].type === 'Oro' || data[0].type === 'ORO')) {
        const firstRowName = data[0].name
        // Si el nombre contiene ":" o es muy descriptivo, podría ser el título
        if (firstRowName.includes(':') || firstRowName.length > 15) {
          defaultExpansion = firstRowName
        }
      }

      for (const row of data) {
        // Extraer campos con múltiples variantes de nombre
        const name = row.name || row.Name || row.NOMBRE || row.nombre
        const type = normalizeType(row.type || row.Type || row.TIPO || row.tipo)
        const rarity = normalizeRarity(row.rarity || row.Rarity || row.RAREZA || row.rareza)
        // Si no hay campo expansion/edition, usar el nombre del archivo
        let expansion = row.expansion || row.Expansion || row.EXPANSION || row.edition || row.Edition || row.EDITION
        // Si expansion es solo un número o está vacío, usar el nombre del archivo
        if (!expansion || /^\d+$/.test(String(expansion))) {
          expansion = defaultExpansion
        }
        const race = row.race || row.Race || row.RAZA || row.raza
        const cost = toNumber(row.cost || row.Cost || row.COSTE || row.coste)
        const attack = toNumber(row.attack || row.Attack || row.ATAQUE || row.ataque)
        const defense = toNumber(row.defense || row.Defense || row.DEFENSA || row.defensa)
        const description = row.description || row.Description || row.DESCRIPCION || row.descripcion || null
        const imageFile = row.image_file || row.ImageFile || row.IMAGE_FILE || row.imageFile || null
        const imageUrl = row.image_url || row.ImageUrl || row.IMAGE_URL || row.imageUrl || null

        // Validar campos requeridos
        if (!name || !type || !rarity || !expansion) {
          console.log(`   ├─ ⚠️  Fila omitida: faltan campos requeridos (nombre: ${name || 'N/A'}, tipo: ${type || 'N/A'}, rareza: ${rarity || 'N/A'}, expansión: ${expansion || 'N/A'})`)
          fileErrors++
          continue
        }

        try {
          const cardData = {
            name: name.trim(),
            type,
            cost,
            attack,
            defense,
            description: description?.trim() || null,
            image_file: imageFile?.trim() || null,
            image_url: imageUrl?.trim() || null,
            rarity,
            expansion: expansion.trim(),
            race: race?.trim() || null,
            is_active: true
          }

          // Crear nueva carta
          const { error: insertError } = await supabase
            .from('cards')
            .insert(cardData)

          if (insertError) {
            console.log(`   ├─ ❌ Error creando "${name}": ${insertError.message}`)
            fileErrors++
          } else {
            console.log(`   ├─ ✅ Creada: "${name}" (${expansion})`)
            fileCreated++
            expansionStats[expansion] = (expansionStats[expansion] || 0) + 1
          }
        } catch (error: any) {
          console.log(`   ├─ ❌ Error procesando "${name}": ${error.message || error}`)
          fileErrors++
        }
      }

      console.log(`   ├─ ✅ Creadas: ${fileCreated}`)
      console.log(`   └─ ❌ Errores: ${fileErrors}\n`)

      totalCreated += fileCreated
      totalErrors += fileErrors
    } catch (error: any) {
      console.log(`   └─ ❌ Error leyendo archivo: ${error.message || error}\n`)
      totalErrors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN FINAL')
  console.log('='.repeat(50))
  console.log(`✅ Total creadas: ${totalCreated}`)
  console.log(`❌ Total errores: ${totalErrors}`)
  console.log('\n📈 Estadísticas por expansión:')
  Object.entries(expansionStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([expansion, count]) => {
      console.log(`   ${expansion}: ${count}`)
    })
  console.log('='.repeat(50) + '\n')
}

// Ejecutar
resetAndImportAll()
  .then(() => {
    console.log('✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

