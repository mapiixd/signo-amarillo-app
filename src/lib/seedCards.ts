import { prisma } from './prisma'

async function seedMoreCards() {
  console.log('🌱 Creando más cartas con imágenes...')

  // Definir expansiones disponibles con sus cantidades de cartas
  const expansions = [
    { name: 'Cenizas de Fuego', folder: 'cenizas_de_fuego', count: 33 },
    { name: 'Espiritu Samurai', folder: 'espiritu_samurai', count: 144 },
    { name: 'Hielo Inmortal', folder: 'hielo_inmortal', count: 33 },
    { name: 'Giger', folder: 'giger', count: 12 },
    { name: 'Secretos Arcanos', folder: 'secretos_arcanos', count: 15 },
    { name: 'Zodiaco', folder: 'zodiaco', count: 12 },
    { name: 'Lootbox 2024', folder: 'lootbox_2024', count: 39 },
    { name: 'Raciales Imp 2024', folder: 'raciales_imp_2024', count: 144 }
  ]

  // Tipos de cartas disponibles
  const cardTypes = ['criatura', 'hechizo', 'permanente', 'artefacto', 'encantamiento']

  // Rarezas disponibles
  const rarities = ['común', 'poco común', 'rara', 'mítica', 'legendaria']

  let totalCards = 0

  for (const expansion of expansions) {
    console.log(`Procesando expansión: ${expansion.name}`)

    for (let i = 1; i <= Math.min(expansion.count, 50); i++) { // Limitar a 50 cartas por expansión para no sobrecargar
      const paddedNumber = i.toString().padStart(3, '0')
      const cardName = `Carta ${expansion.name} ${paddedNumber}`

      // Verificar si la carta ya existe
      const existingCard = await prisma.card.findFirst({
        where: { name: cardName }
      })

      if (!existingCard) {
        // Generar estadísticas aleatorias
        const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)]
        const rarity = rarities[Math.floor(Math.random() * rarities.length)]

        let cost: number | null = null
        let attack: number | null = null
        let defense: number | null = null

        if (cardType === 'criatura') {
          cost = Math.floor(Math.random() * 10) + 1
          attack = Math.floor(Math.random() * 8) + 1
          defense = Math.floor(Math.random() * 8) + 1
        } else {
          cost = Math.floor(Math.random() * 8) + 1
        }

        const descriptions = [
          'Una carta poderosa con efectos devastadores.',
          'Invoca criaturas legendarias del olvido.',
          'Destruye todo a su paso con fuego eterno.',
          'Protege a tus aliados con escudos mágicos.',
          'Manipula el tiempo y el espacio a voluntad.',
          'Conjura hechizos de destrucción masiva.',
          'Enfrenta a los dioses con esta reliquia antigua.',
          'Domina los elementos con maestría absoluta.'
        ]

        const description = descriptions[Math.floor(Math.random() * descriptions.length)]

        try {
          await prisma.card.create({
            data: {
              name: cardName,
              type: cardType,
              cost,
              attack,
              defense,
              description,
              imageFile: `${paddedNumber}.png`,
              imageUrl: `/cards/${expansion.folder}/${paddedNumber}.png`,
              rarity,
              expansion: expansion.name
            }
          })

          totalCards++
          console.log(`✅ ${cardName}`)
        } catch (error) {
          console.log(`❌ Error creando ${cardName}: ${error}`)
        }
      }
    }
  }

  console.log(`✅ Se crearon ${totalCards} nuevas cartas`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMoreCards().catch(console.error)
}

export { seedMoreCards }
