import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Carpeta donde están los archivos Excel (ajusta la ruta según tu sistema)
// Puedes usar una ruta específica o la carpeta 'data' del proyecto
const dataFolder = process.env.DATA_FOLDER || 'D:\\Proyectos\\weas-mias\\datos' || path.join(process.cwd(), 'data')

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

async function importExcel() {
  console.log('🔄 Iniciando importación de cartas KVSM Titanes desde Excel...\n')
  console.log('⚠️  Este script solo procesará el archivo de KVSM Titanes para preservar la integridad de otras ediciones.\n')

  // Verificar que existe la carpeta
  if (!fs.existsSync(dataFolder)) {
    console.error(`❌ La carpeta "${dataFolder}" no existe.`)
    console.log(`\n💡 Crea la carpeta "data" en la raíz del proyecto y coloca allí los archivos Excel.`)
    process.exit(1)
  }

  // Leer todos los archivos Excel y filtrar solo KVSM Titanes
  const allFiles = fs.readdirSync(dataFolder).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
  const files = allFiles.filter(f => 
    f.toLowerCase().includes('kvsm') || 
    f.toLowerCase().includes('titanes')
  )
  
  console.log(`📁 Archivos Excel encontrados: ${allFiles.length}`)
  console.log(`📁 Archivos KVSM Titanes encontrados: ${files.length}\n`)

  if (files.length === 0) {
    console.log(`⚠️  No se encontró ningún archivo de KVSM Titanes en "${dataFolder}"`)
    console.log(`\n💡 Archivos disponibles:`)
    allFiles.forEach(f => console.log(`   - ${f}`))
    console.log(`\n💡 El archivo debe contener "kvsm" o "titanes" en el nombre.`)
    process.exit(0)
  }

  if (files.length > 1) {
    console.log(`⚠️  Se encontraron múltiples archivos de KVSM Titanes:`)
    files.forEach(f => console.log(`   - ${f}`))
    console.log(`\n⚠️  Se procesarán todos los archivos encontrados.\n`)
  }

  let totalCreated = 0
  let totalUpdated = 0
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
      let fileUpdated = 0
      let fileErrors = 0

      // Determinar el nombre de la expansión desde el nombre del archivo o primera fila
      let defaultExpansion = file.replace(/datos_api_cartas_/i, '').replace(/\.xlsx?$/i, '').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      // Normalizar para KVSM Titanes
      if (defaultExpansion.toLowerCase().includes('kvsm') || defaultExpansion.toLowerCase().includes('titanes')) {
        defaultExpansion = 'Kaiju VS Mecha: Titanes'
      }
      
      // Si la primera fila tiene un nombre que parece ser el título de la expansión, usarlo
      if (data.length > 0 && data[0].name && (data[0].type === 'Oro' || data[0].type === 'ORO')) {
        const firstRowName = data[0].name
        // Si el nombre contiene ":" o es muy descriptivo, podría ser el título
        if (firstRowName.includes(':') || firstRowName.length > 15) {
          defaultExpansion = firstRowName
        }
      }

      // Asegurar que la expansión sea KVSM Titanes
      if (!defaultExpansion.toLowerCase().includes('titanes') && !defaultExpansion.toLowerCase().includes('kvsm')) {
        defaultExpansion = 'Kaiju VS Mecha: Titanes'
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
        
        // Normalizar expansión para KVSM Titanes
        if (expansion.toLowerCase().includes('kvsm') || expansion.toLowerCase().includes('titanes')) {
          expansion = 'Kaiju VS Mecha: Titanes'
        }
        
        // Validar que solo se procesen cartas de KVSM Titanes
        if (!expansion.toLowerCase().includes('titanes') && !expansion.toLowerCase().includes('kvsm')) {
          console.log(`   ├─ ⚠️  Fila omitida: expansión "${expansion}" no es KVSM Titanes`)
          fileErrors++
          continue
        }
        
        // Asegurar que la expansión sea exactamente "Kaiju VS Mecha: Titanes"
        expansion = 'Kaiju VS Mecha: Titanes'
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
          // Buscar si la carta ya existe (mismo nombre, rareza y expansión)
          // Esto permite tener múltiples versiones de la misma carta con diferentes rarezas
          const { data: existingCards, error: searchError } = await supabase
            .from('cards')
            .select('id, name, expansion, rarity')
            .ilike('name', name.trim())
            .eq('expansion', expansion.trim())
            .eq('rarity', rarity)

          if (searchError) {
            console.log(`   ├─ ❌ Error buscando "${name}": ${searchError.message}`)
            fileErrors++
            continue
          }

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

          if (existingCards && existingCards.length > 0) {
            // Actualizar carta existente
            const { error: updateError } = await supabase
              .from('cards')
              .update(cardData)
              .eq('id', existingCards[0].id)

            if (updateError) {
              console.log(`   ├─ ❌ Error actualizando "${name}": ${updateError.message}`)
              fileErrors++
            } else {
              console.log(`   ├─ ✅ Actualizada: "${name}" (${expansion}, ${rarity})`)
              fileUpdated++
              expansionStats[expansion] = (expansionStats[expansion] || 0) + 1
            }
          } else {
            // Crear nueva carta
            const { error: insertError } = await supabase
              .from('cards')
              .insert(cardData)

            if (insertError) {
              console.log(`   ├─ ❌ Error creando "${name}": ${insertError.message}`)
              fileErrors++
            } else {
              console.log(`   ├─ ✅ Creada: "${name}" (${expansion}, ${rarity})`)
              fileCreated++
              expansionStats[expansion] = (expansionStats[expansion] || 0) + 1
            }
          }
        } catch (error: any) {
          console.log(`   ├─ ❌ Error procesando "${name}": ${error.message || error}`)
          fileErrors++
        }
      }

      console.log(`   ├─ ✅ Creadas: ${fileCreated}`)
      console.log(`   ├─ ✅ Actualizadas: ${fileUpdated}`)
      console.log(`   └─ ❌ Errores: ${fileErrors}\n`)

      totalCreated += fileCreated
      totalUpdated += fileUpdated
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
  console.log(`✅ Total actualizadas: ${totalUpdated}`)
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
importExcel()
  .then(() => {
    console.log('✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

