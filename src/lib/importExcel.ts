import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { readdirSync } from 'fs'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeo de tipos del Excel a la base de datos
const typeMapping: { [key: string]: string } = {
  'Talisman': 'TALISMAN',
  'Arma': 'ARMA',
  'Totem': 'TOTEM',
  'Aliado': 'ALIADO',
  'Oro': 'ORO'
}

// Mapeo de rarezas del Excel a la base de datos
const rarityMapping: { [key: string]: string } = {
  'Vasallo': 'VASALLO',
  'Cortesano': 'CORTESANO',
  'Real': 'REAL',
  'Mega Real': 'MEGA_REAL',
  'Ultra Real': 'ULTRA_REAL',
  'Legendaria': 'LEGENDARIA',
  'Promo': 'PROMO',
  'Secreta': 'SECRETA'
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
  'Onyria': 'onyria'
}

async function importExcelData() {
  console.log('🚀 Iniciando importación de datos Excel...')

  const excelDir = 'D:/Proyectos/weas-mias/datos'
  const files = readdirSync(excelDir).filter(file => file.endsWith('.xlsx'))

  console.log(`Encontrados ${files.length} archivos Excel`)

  let totalImported = 0

  for (const file of files) {
    console.log(`\n📄 Procesando: ${file}`)

    try {
      const filePath = join(excelDir, file)
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log(`   Encontradas ${jsonData.length} filas en ${sheetName}`)

      let imported = 0

      for (const row of jsonData as any[]) {
        try {
          // Extraer datos del Excel (múltiples formatos posibles)
          let name = row['name'] || row['Nombre'] || ''
          let type = row['type'] || row['Tipo'] || ''
          let cost = row['cost'] || row['Coste'] || row['coste'] || null
          let attack = row['damage'] || row['Ataque'] || row['ataque'] || row['attack'] || null
          let defense = row['Defensa'] || row['defensa'] || row['defense'] || null
          let description = row['ability'] || row['Habilidad'] || row['Descripcion'] || row['habilidad'] || row['descripcion'] || row['description'] || row['flavour'] || ''
          let rarity = row['rarity'] || row['Rareza'] || row['rareza'] || ''
          let expansion = row['edition'] || row['Expansion'] || row['Edicion'] || row['expansion'] || row['edicion'] || ''
          let edid = row['edid'] || row['Edid'] || row['ID'] || ''

          // Para archivos con estructura de "edition" numérica, buscar el nombre de expansión
          if (typeof expansion === 'number' || /^\d+$/.test(expansion)) {
            // Extraer del slug del archivo
            if (file.includes('cenizas_de_fuego')) expansion = 'Cenizas de Fuego'
            else if (file.includes('espiritu_samurai')) expansion = 'Espiritu Samurai'
            else if (file.includes('hielo_inmortal')) expansion = 'Hielo Inmortal'
            else if (file.includes('giger')) expansion = 'Giger'
            else if (file.includes('secretos_arcanos')) expansion = 'Secretos Arcanos'
            else if (file.includes('zodiaco')) expansion = 'Zodiaco'
            else if (file.includes('lootbox_2024')) expansion = 'Lootbox 2024'
            else if (file.includes('raciales_imp_2024')) expansion = 'Raciales Imp 2024'
            else if (file.includes('amenazakaiju')) expansion = 'Amenaza Kaiju'
            else if (file.includes('bestiarium')) expansion = 'Bestiarium'
            else if (file.includes('escuadronmecha')) expansion = 'Escuadron Mecha'
            else if (file.includes('napoleon')) expansion = 'Napoleon'
            else if (file.includes('onyria')) expansion = 'Onyria'
          }

          // Corregir rarezas secretas basadas en el slug
          let edid_slug = row['slug'] || row['edid'] || edid
          if (edid_slug && typeof edid_slug === 'string' && edid_slug.includes('_secreta')) {
            rarity = 'Secreta'
          }

          // Para tipo "Oro", el coste debe ser null
          if (type === 'Oro') {
            cost = null
          }

          // Validar datos requeridos
          if (!name || !type || !rarity || !expansion) {
            console.log(`   ⚠️  Fila incompleta - Nombre: ${name}, Tipo: ${type}, Rareza: ${rarity}, Exp: ${expansion}`)
            continue
          }

          // Convertir tipos
          const dbType = typeMapping[type] || 'ALIADO'
          const dbRarity = rarityMapping[rarity] || 'VASALLO'
          const folderName = folderMapping[expansion] || expansion.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

          // Generar número de imagen con padding (edid es el número de imagen)
          const imageNumber = edid ? edid.toString().padStart(3, '0') : '001'
          const imageFile = `${imageNumber}.png`
          const imageUrl = `/cards/${folderName}/${imageFile}`

          // Insertar en Supabase
          const { data, error } = await supabase
            .from('cards')
            .insert({
              name,
              type: dbType,
              cost: cost !== null && cost !== '' ? parseInt(cost) : null,
              attack: attack !== null && attack !== '' ? parseInt(attack) : null,
              defense: defense !== null && defense !== '' ? parseInt(defense) : null,
              description,
              image_url: imageUrl,
              image_file: imageFile,
              rarity: dbRarity,
              expansion,
              is_active: true
            })
            .select()

          if (error) {
            console.log(`   ❌ Error insertando ${name}: ${error.message}`)
          } else {
            console.log(`   ✅ ${name} (${dbType}, ${dbRarity}) - ${imageFile}`)
            imported++
          }

        } catch (rowError) {
          console.log(`   ❌ Error procesando fila: ${rowError}`)
        }
      }

      console.log(`   📊 Importadas ${imported} cartas de ${file}`)
      totalImported += imported

    } catch (fileError) {
      console.log(`   ❌ Error procesando ${file}: ${fileError}`)
    }
  }

  console.log(`\n🎉 Importación completada: ${totalImported} cartas totales importadas`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  importExcelData().catch(console.error)
}

export { importExcelData }
