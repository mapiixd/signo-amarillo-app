import { prisma } from './prisma'

async function updateCardImages() {
  console.log('🔄 Iniciando actualización de imágenes...')

  try {
    // Obtener todas las cartas
    const cards = await prisma.card.findMany()
    console.log(`Encontradas ${cards.length} cartas`)

    // Imágenes simples para las primeras cartas
    const simpleImages = [
      { file: '001.png', expansion: 'Cenizas de Fuego', folder: 'cenizas_de_fuego' },
      { file: '002.png', expansion: 'Espiritu Samurai', folder: 'espiritu_samurai' },
      { file: '003.png', expansion: 'Hielo Inmortal', folder: 'hielo_inmortal' },
      { file: '001.png', expansion: 'Giger', folder: 'giger' },
      { file: '001.png', expansion: 'Secretos Arcanos', folder: 'secretos_arcanos' },
      { file: '001.png', expansion: 'Zodiaco', folder: 'zodiaco' },
      { file: '001.png', expansion: 'Lootbox 2024', folder: 'lootbox_2024' },
      { file: '001.png', expansion: 'Raciales Imp 2024', folder: 'raciales_imp_2024' }
    ]

    // Actualizar cada carta con una imagen
    for (let i = 0; i < Math.min(cards.length, simpleImages.length); i++) {
      const card = cards[i]
      const imageData = simpleImages[i]

      console.log(`Actualizando ${card.name} con ${imageData.file}`)

      await prisma.card.update({
        where: { id: card.id },
        data: {
          imageFile: imageData.file,
          imageUrl: `/cards/${imageData.folder}/${imageData.file}`,
          expansion: imageData.expansion
        }
      })

      console.log(`✅ ${card.name}: /cards/${imageData.folder}/${imageData.file}`)
    }

    console.log('✅ Actualización completada')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateCardImages()
}

export { updateCardImages }
