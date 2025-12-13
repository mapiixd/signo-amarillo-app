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
  cost?: number | string
  attack?: number | string
  defense?: number | string
  race?: string
  _rowIndex?: number
}

async function checkDuplicates() {
  console.log('🔍 Analizando duplicados en el archivo Excel...\n')

  const file = 'datos_api_cartas_kvsm_titanes.xlsx'
  const filePath = path.join(dataFolder, file)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ El archivo "${filePath}" no existe.`)
    process.exit(1)
  }

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data: CardRow[] = XLSX.utils.sheet_to_json(worksheet)

  console.log(`📊 Total de filas: ${data.length}\n`)

  // Agrupar por nombre
  const cardsByName = new Map<string, CardRow[]>()
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const name = (row.name || row.Name || row.NOMBRE || row.nombre || '').trim()
    if (!name) continue

    if (!cardsByName.has(name)) {
      cardsByName.set(name, [])
    }
    cardsByName.get(name)!.push({ ...row, _rowIndex: i + 2 })
  }

  // Encontrar duplicados
  const duplicates = Array.from(cardsByName.entries()).filter(([_, cards]) => cards.length > 1)
  
  console.log(`⚠️  Nombres duplicados encontrados: ${duplicates.length}\n`)

  // Analizar cada duplicado
  for (const [name, cards] of duplicates) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📌 "${name}" - aparece ${cards.length} veces`)
    console.log('='.repeat(60))
    
    cards.forEach((card, idx) => {
      const type = card.type || card.Type || card.TIPO || card.tipo || 'N/A'
      const rarity = card.rarity || card.Rarity || card.RAREZA || card.rareza || 'N/A'
      const cost = card.cost || 'N/A'
      const attack = card.attack || 'N/A'
      const defense = card.defense || 'N/A'
      const race = card.race || 'N/A'
      
      console.log(`\n  Ocurrencia ${idx + 1} (Fila ${card._rowIndex}):`)
      console.log(`    Tipo: ${type}`)
      console.log(`    Rareza: ${rarity}`)
      console.log(`    Coste: ${cost}`)
      console.log(`    Ataque: ${attack}`)
      console.log(`    Defensa: ${defense}`)
      console.log(`    Raza: ${race}`)
    })

    // Verificar si son realmente diferentes
    const uniqueCards = new Set(
      cards.map(c => 
        `${c.type || ''}|${c.rarity || ''}|${c.cost || ''}|${c.attack || ''}|${c.defense || ''}|${c.race || ''}`
      )
    )
    
    if (uniqueCards.size > 1) {
      console.log(`\n  ⚠️  ATENCIÓN: Estas son cartas DIFERENTES con el mismo nombre!`)
      console.log(`     Deberían tener nombres únicos o identificadores diferentes.`)
    } else {
      console.log(`\n  ✅ Son cartas idénticas (posible duplicado real en el Excel)`)
    }
  }

  // Verificar en Supabase cuántas de estas están
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('🔍 Verificando en Supabase...')
  console.log('='.repeat(60))

  const duplicateNames = duplicates.map(([name]) => name)
  
  for (const name of duplicateNames.slice(0, 10)) { // Verificar las primeras 10
    const { data: supabaseCards, error } = await supabase
      .from('cards')
      .select('name, type, rarity, cost, attack, defense, race')
      .eq('expansion', 'Kaiju VS Mecha: Titanes')
      .ilike('name', name)

    if (error) {
      console.log(`❌ Error consultando "${name}": ${error.message}`)
    } else if (supabaseCards && supabaseCards.length > 0) {
      console.log(`\n📌 "${name}":`)
      console.log(`   En Supabase: ${supabaseCards.length} carta(s)`)
      supabaseCards.forEach((card, idx) => {
        console.log(`   ${idx + 1}. Tipo: ${card.type}, Rareza: ${card.rarity}, Coste: ${card.cost}, Ataque: ${card.attack}`)
      })
      const excelCount = cardsByName.get(name)?.length || 0
      if (excelCount > supabaseCards.length) {
        console.log(`   ⚠️  Faltan ${excelCount - supabaseCards.length} carta(s) en Supabase`)
      }
    } else {
      console.log(`\n📌 "${name}": No encontrada en Supabase`)
    }
  }

  console.log(`\n\n📊 RESUMEN:`)
  console.log(`   Total de nombres únicos: ${cardsByName.size}`)
  console.log(`   Nombres con duplicados: ${duplicates.length}`)
  console.log(`   Total de cartas en Excel: ${data.length}`)
  console.log(`   Cartas esperadas (sin duplicados): ${cardsByName.size}`)
  console.log(`   Cartas en Supabase: 210`)
  console.log(`   Diferencia: ${cardsByName.size - 210} cartas faltantes`)
}

checkDuplicates()
  .then(() => {
    console.log('\n✨ Análisis completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

