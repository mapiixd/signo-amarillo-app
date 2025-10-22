import { createClient } from '@supabase/supabase-js'
import { readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateCardImages() {
  console.log('🔄 Actualizando imágenes de cartas en Supabase...')

  try {
    // Obtener todas las cartas
    const { data: cards, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    console.log(`Encontradas ${cards.length} cartas`)

    // Mapeo de expansiones a carpetas de imágenes
    const expansionFolders: { [key: string]: string } = {
      'Cenizas de Fuego': 'cenizas_de_fuego',
      'Espiritu Samurai': 'espiritu_samurai',
      'Hielo Inmortal': 'hielo_inmortal',
      'Giger': 'giger',
      'Secretos Arcanos': 'secretos_arcanos',
      'Zodiaco': 'zodiaco',
      'Lootbox 2024': 'lootbox_2024',
      'Raciales Imp 2024': 'raciales_imp_2024'
    }

    // Contadores para asignar imágenes
    const imageCounters: { [key: string]: number } = {}

    // Inicializar contadores
    Object.values(expansionFolders).forEach(folder => {
      imageCounters[folder] = 1
    })

    let updatedCount = 0

    for (const card of cards) {
      const folderName = expansionFolders[card.expansion]

      if (folderName) {
        try {
          // Listar archivos de la carpeta de expansión
          const imageDir = join(process.cwd(), 'public/cards', folderName)
          const imageFiles = readdirSync(imageDir)
            .filter(file => file.endsWith('.png'))
            .sort()

          // Obtener el siguiente número de imagen disponible
          const currentCounter = imageCounters[folderName] || 1
          const paddedNumber = currentCounter.toString().padStart(3, '0')
          const imageFile = `${paddedNumber}.png`

          // Verificar si la imagen existe
          if (imageFiles.includes(imageFile)) {
            const imageUrl = `/cards/${folderName}/${imageFile}`

            // Actualizar la carta en Supabase
            const { error: updateError } = await supabase
              .from('cards')
              .update({
                image_file: imageFile,
                image_url: imageUrl
              })
              .eq('id', card.id)

            if (updateError) {
              console.log(`❌ Error actualizando ${card.name}: ${updateError.message}`)
            } else {
              console.log(`✅ ${card.name}: ${imageUrl}`)
              updatedCount++
              imageCounters[folderName] = currentCounter + 1
            }
          } else {
            console.log(`⚠️  ${card.name}: imagen ${imageFile} no encontrada en ${folderName}`)
          }
        } catch (error) {
          console.log(`❌ Error procesando ${card.name}: ${error}`)
        }
      } else {
        console.log(`⚠️  ${card.name}: expansión '${card.expansion}' no mapeada`)
      }
    }

    console.log(`✅ Actualización completada: ${updatedCount} cartas actualizadas`)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateCardImages()
}

export { updateCardImages }
