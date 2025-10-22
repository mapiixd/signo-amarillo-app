import { prisma } from './prisma'

export async function seedDatabase() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear algunas cartas de ejemplo de Mitos y Leyendas
  const cards = [
    {
      name: 'Dragón Ancestral',
      type: 'criatura',
      cost: 8,
      attack: 6,
      defense: 6,
      description: 'Vuela. Cuando esta criatura entra en juego, destruye todas las criaturas con defensa menor a 4.',
      rarity: 'mítica',
      expansion: 'Imperio'
    },
    {
      name: 'Mago del Tiempo',
      type: 'criatura',
      cost: 4,
      attack: 2,
      defense: 4,
      description: 'Cuando lanzas un hechizo, roba una carta.',
      rarity: 'rara',
      expansion: 'Imperio'
    },
    {
      name: 'Espada Legendaria',
      type: 'artefacto',
      cost: 3,
      description: 'La criatura equipada obtiene +2/+2. Equipa a una criatura.',
      rarity: 'rara',
      expansion: 'Imperio'
    },
    {
      name: 'Bola de Fuego',
      type: 'hechizo',
      cost: 2,
      description: 'Inflige 3 de daño a cualquier objetivo.',
      rarity: 'común',
      expansion: 'Imperio'
    },
    {
      name: 'Guardián de la Fortaleza',
      type: 'criatura',
      cost: 5,
      attack: 3,
      defense: 6,
      description: 'Defensor. Cuando esta criatura bloquea, gana +1/+1.',
      rarity: 'poco común',
      expansion: 'Imperio'
    },
    {
      name: 'Sacerdotisa de la Luz',
      type: 'criatura',
      cost: 3,
      attack: 2,
      defense: 3,
      description: 'Cuando esta criatura entra en juego, gana 3 de vida.',
      rarity: 'común',
      expansion: 'Imperio'
    },
    {
      name: 'Portal Dimensional',
      type: 'hechizo',
      cost: 6,
      description: 'Busca en tu biblioteca hasta 3 criaturas y ponlas en tu mano. Baraja tu biblioteca.',
      rarity: 'mítica',
      expansion: 'Imperio'
    },
    {
      name: 'Caballero Imperial',
      type: 'criatura',
      cost: 4,
      attack: 4,
      defense: 4,
      description: 'Primera impresión. (La primera vez que lanzas esta carta cada turno, cuesta 2 menos.)',
      rarity: 'poco común',
      expansion: 'Imperio'
    }
  ]

  for (const cardData of cards) {
    try {
      await prisma.card.create({
        data: cardData
      })
    } catch (error) {
      // Ignorar errores de duplicados
      console.log(`Carta ${cardData.name} ya existe, saltando...`)
    }
  }

  console.log('✅ Seed completado exitosamente')
}
