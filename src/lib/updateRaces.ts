import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const dataFolder = 'D:\\Proyectos\\weas-mias\\datos'

interface CardData {
  name: string
  race?: string
  type?: string
}

async function updateRaces() {
  console.log('🔄 Iniciando actualización de razas...\n')

  // Leer todos los archivos Excel
  const files = fs.readdirSync(dataFolder).filter(f => f.endsWith('.xlsx'))
  console.log(`📁 Encontrados ${files.length} archivos Excel\n`)

  let totalUpdated = 0
  let totalErrors = 0
  const raceStats: Record<string, number> = {}

  for (const file of files) {
    console.log(`📖 Procesando: ${file}`)
    const filePath = path.join(dataFolder, file)
    
    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: any[] = XLSX.utils.sheet_to_json(worksheet)

      console.log(`   ├─ ${data.length} registros encontrados`)

      let fileUpdates = 0
      let fileErrors = 0

      for (const row of data) {
        // Buscar el campo de nombre (puede variar)
        const name = row.name || row.Name || row.NOMBRE || row.nombre
        const race = row.race || row.Race || row.RAZA || row.raza || row.Raza
        const type = row.type || row.Type || row.TIPO || row.tipo || row.Tipo

        if (!name) continue

        // Solo procesar aliados con raza definida
        const isAlly = type === 'ALIADO' || type === 'Aliado'
        if (isAlly && race && race.trim() !== '') {
          const raceTrimmed = race.trim()

          try {
            // Buscar la carta por nombre exacto
            const { data: cards, error: searchError } = await supabase
              .from('cards')
              .select('id, name, race, type')
              .ilike('name', name)
              .eq('type', 'ALIADO')

            if (searchError) {
              console.log(`   ├─ ❌ Error buscando "${name}": ${searchError.message}`)
              fileErrors++
              continue
            }

            if (!cards || cards.length === 0) {
              // La carta no existe, saltarla silenciosamente
              continue
            }

            // Actualizar todas las versiones de esta carta
            for (const card of cards) {
              // Solo actualizar si la raza es diferente o está vacía
              const currentRace = card.race?.trim() || ''
              if (currentRace !== raceTrimmed) {
                const { error: updateError } = await supabase
                  .from('cards')
                  .update({ race: raceTrimmed })
                  .eq('id', card.id)

                if (updateError) {
                  console.log(`   ├─ ❌ Error actualizando "${name}": ${updateError.message}`)
                  fileErrors++
                } else {
                  console.log(`   ├─ ✅ "${name}": ${currentRace || 'NULL'} → ${raceTrimmed}`)
                  fileUpdates++
                  raceStats[raceTrimmed] = (raceStats[raceTrimmed] || 0) + 1
                }
              }
            }
          } catch (error) {
            console.log(`   ├─ ❌ Error procesando "${name}": ${error}`)
            fileErrors++
          }
        }
      }

      console.log(`   ├─ ✅ Actualizadas: ${fileUpdates}`)
      console.log(`   └─ ❌ Errores: ${fileErrors}\n`)

      totalUpdated += fileUpdates
      totalErrors += fileErrors
    } catch (error) {
      console.log(`   └─ ❌ Error leyendo archivo: ${error}\n`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN FINAL')
  console.log('='.repeat(50))
  console.log(`✅ Total actualizadas: ${totalUpdated}`)
  console.log(`❌ Total errores: ${totalErrors}`)
  console.log('\n📈 Estadísticas por raza:')
  Object.entries(raceStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([race, count]) => {
      console.log(`   ${race}: ${count}`)
    })
  console.log('='.repeat(50) + '\n')
}

// Ejecutar
updateRaces()
  .then(() => {
    console.log('✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

