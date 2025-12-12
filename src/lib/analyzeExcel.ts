import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
}

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

async function analyzeExcel() {
  console.log('🔍 Analizando archivos Excel para encontrar el de KVSM Titanes...\n')

  if (!fs.existsSync(dataFolder)) {
    console.error(`❌ La carpeta "${dataFolder}" no existe.`)
    console.log(`\n💡 Verifica la ruta de la carpeta de datos.`)
    process.exit(1)
  }

  const files = fs.readdirSync(dataFolder).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
  console.log(`📁 Encontrados ${files.length} archivos Excel\n`)

  // Buscar archivos que puedan ser de KVSM Titanes
  const kvsmFiles = files.filter(f => 
    f.toLowerCase().includes('kvsm') || 
    f.toLowerCase().includes('titanes') ||
    f.toLowerCase().includes('titanes')
  )

  if (kvsmFiles.length === 0) {
    console.log('⚠️  No se encontró ningún archivo con "kvsm" o "titanes" en el nombre.')
    console.log('\n📋 Archivos disponibles:')
    files.forEach(f => console.log(`   - ${f}`))
    console.log('\n💡 Por favor, indica cuál es el archivo de KVSM Titanes o proporciona la ruta completa.')
    process.exit(0)
  }

  for (const file of kvsmFiles) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📖 Analizando: ${file}`)
    console.log('='.repeat(60))
    
    const filePath = path.join(dataFolder, file)
    
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: CardRow[] = XLSX.utils.sheet_to_json(worksheet)

      console.log(`\n📊 Total de filas en Excel: ${data.length}`)

      // Determinar el nombre de la expansión
      let defaultExpansion = file.replace(/datos_api_cartas_/i, '').replace(/\.xlsx?$/i, '').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      if (data.length > 0 && data[0].name && (data[0].type === 'Oro' || data[0].type === 'ORO')) {
        const firstRowName = data[0].name
        if (firstRowName.includes(':') || firstRowName.length > 15) {
          defaultExpansion = firstRowName
        }
      }

      // Normalizar para KVSM Titanes
      if (defaultExpansion.toLowerCase().includes('kvsm') || defaultExpansion.toLowerCase().includes('titanes')) {
        defaultExpansion = 'Kaiju VS Mecha: Titanes'
      }

      console.log(`📌 Expansión detectada: "${defaultExpansion}"`)

      // Analizar cada fila
      let validRows = 0
      let invalidRows = 0
      const invalidRowsDetails: Array<{row: number, reason: string, data: any}> = []

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const name = row.name || row.Name || row.NOMBRE || row.nombre
        const type = normalizeType(row.type || row.Type || row.TIPO || row.tipo)
        const rarity = normalizeRarity(row.rarity || row.Rarity || row.RAREZA || row.rareza)
        let expansion = row.expansion || row.Expansion || row.EXPANSION || row.edition || row.Edition || row.EDITION
        if (!expansion || /^\d+$/.test(String(expansion))) {
          expansion = defaultExpansion
        }

        // Verificar si es una fila válida
        if (!name || !type || !rarity || !expansion) {
          invalidRows++
          const reasons: string[] = []
          if (!name) reasons.push('sin nombre')
          if (!type) reasons.push('sin tipo')
          if (!rarity) reasons.push('sin rareza')
          if (!expansion) reasons.push('sin expansión')
          
          invalidRowsDetails.push({
            row: i + 2, // +2 porque Excel empieza en 1 y tiene header
            reason: reasons.join(', '),
            data: { name: name || 'N/A', type: type || 'N/A', rarity: rarity || 'N/A', expansion: expansion || 'N/A' }
          })
        } else {
          validRows++
        }
      }

      console.log(`\n✅ Filas válidas: ${validRows}`)
      console.log(`❌ Filas inválidas: ${invalidRows}`)

      // Verificar cuántas de las válidas están en Supabase
      console.log(`\n🔍 Verificando cuántas cartas están en Supabase...`)
      
      const { data: supabaseCards, error, count } = await supabase
        .from('cards')
        .select('name, expansion', { count: 'exact' })
        .eq('expansion', 'Kaiju VS Mecha: Titanes')

      if (error) {
        console.log(`❌ Error consultando Supabase: ${error.message}`)
      } else {
        console.log(`📊 Cartas en Supabase: ${count}`)
        console.log(`📊 Cartas válidas en Excel: ${validRows}`)
        console.log(`📊 Diferencia: ${validRows - (count || 0)} cartas faltantes`)
      }

      // Mostrar algunas filas inválidas como ejemplo
      if (invalidRowsDetails.length > 0) {
        console.log(`\n⚠️  Primeras 10 filas inválidas:`)
        invalidRowsDetails.slice(0, 10).forEach(detail => {
          console.log(`   Fila ${detail.row}: ${detail.reason}`)
          console.log(`      Datos: ${JSON.stringify(detail.data)}`)
        })
        if (invalidRowsDetails.length > 10) {
          console.log(`   ... y ${invalidRowsDetails.length - 10} más`)
        }
      }

      // Verificar si hay cartas duplicadas por nombre
      const cardNames = new Map<string, number>()
      for (const row of data) {
        const name = row.name || row.Name || row.NOMBRE || row.nombre
        if (name) {
          cardNames.set(name.trim(), (cardNames.get(name.trim()) || 0) + 1)
        }
      }
      
      const duplicates = Array.from(cardNames.entries()).filter(([_, count]) => count > 1)
      if (duplicates.length > 0) {
        console.log(`\n⚠️  Nombres duplicados encontrados: ${duplicates.length}`)
        duplicates.slice(0, 5).forEach(([name, count]) => {
          console.log(`   - "${name}": aparece ${count} veces`)
        })
      }

    } catch (error: any) {
      console.log(`❌ Error leyendo archivo: ${error.message || error}`)
    }
  }
}

analyzeExcel()
  .then(() => {
    console.log('\n✨ Análisis completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

