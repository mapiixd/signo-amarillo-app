import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const multiRaceCards = [
  { name: 'Phanuel', races: 'Eterno, Faerie' },
  { name: 'Lord Cochrane', races: 'Caballero, Guerrero' },
  { name: 'Máscara Dorada', races: 'Héroe, Sacerdote' },
  { name: 'Shoggoth', races: 'Faerie, Sombra' },
  { name: 'Yasuke', races: 'Caballero, Guerrero, Héroe' },
  { name: 'Omukade', races: 'Bestia, Dragón, Sombra' },
  { name: 'Daitengu', races: 'Eterno, Faerie, Sacerdote' },
  { name: 'Minamoto no Yoritomo', races: 'Caballero, Héroe' },
  { name: 'Amateratsu - SP', races: 'Eterno, Sacerdote' },
  { name: 'Kitsune - SP', races: 'Bestia, Faerie' },
  { name: 'Azathoth', races: 'Bestia, Sombra' },
  { name: 'Faraón Negro', races: 'Guerrero, Héroe' },
  { name: 'Hastur', races: 'Eterno, Sacerdote' },
  { name: 'Paladín Tríada', races: 'Caballero, Guerrero, Héroe' },
  { name: 'Desafiante', races: 'Eterno, Faerie, Sacerdote' },
  { name: 'Tenebris', races: 'Bestia, Dragón, Sombra' },
  { name: 'Oolaf y Barbosa', races: 'Guerrero, Sacerdote' },
  { name: 'Vinci y Yang', races: 'Caballero, Héroe' },
  { name: 'Arkan y Gortro', races: 'Bestia, Dragón' },
  { name: 'Ópalo y An-uman', races: 'Faerie, Eterno' },
  { name: 'El Rey y el Verdugo', races: 'Caballero, Guerrero' },
  { name: 'Jabberwocky desatado', races: 'Dragón, Sombra' },
  { name: 'Líder del Comité', races: 'Bestia, Faerie' },
  { name: 'Atenea en Wonderland', races: 'Eterno, Héroe' },
  { name: 'Nefertiti de Corazones', races: 'Caballero, Sacerdote' },
  { name: 'Batallón de Ovejas', races: 'Bestia, Guerrero' },
  { name: 'Sancho Panza', races: 'Caballero, Guerrero' },
  { name: 'Dulcinea', races: 'Eterno, Héroe' },
  { name: 'Dorotea', races: 'Faerie, Sacerdote' },
  { name: 'Caballero Espejado', races: 'Caballero, Sombra' },
  { name: 'Ignacio Carrera Pinto', races: 'Caballero, Héroe' },
  { name: 'Arturo Prat', races: 'Caballero, Héroe' },
  { name: 'Kwányip', races: 'Caballero, Guerrero, Héroe' },
  { name: 'Chashkel', races: 'Bestia, Dragón, Sombra' },
  { name: 'Cénuku', races: 'Eterno, Faerie, Sacerdote' },
  { name: 'Tangata Manu', races: 'Caballero, Guerrero, Héroe' },
  { name: 'Aku Aku', races: 'Bestia, Dragón, Sombra' },
  { name: 'Makemake', races: 'Eterno, Faerie, Sacerdote' }
]

async function fixMultiRaceCards() {
  console.log('🔧 Corrigiendo cartas con múltiples razas...\n')

  let updated = 0
  let notFound = 0
  let errors = 0

  for (const card of multiRaceCards) {
    try {
      // Buscar la carta
      const { data: cards, error: searchError } = await supabase
        .from('cards')
        .select('id, name, race, type')
        .ilike('name', card.name)
        .eq('type', 'ALIADO')

      if (searchError) {
        console.log(`❌ Error buscando "${card.name}": ${searchError.message}`)
        errors++
        continue
      }

      if (!cards || cards.length === 0) {
        console.log(`⚠️  No encontrada: "${card.name}"`)
        notFound++
        continue
      }

      // Actualizar todas las versiones
      for (const foundCard of cards) {
        const { error: updateError } = await supabase
          .from('cards')
          .update({ race: card.races })
          .eq('id', foundCard.id)

        if (updateError) {
          console.log(`❌ Error actualizando "${card.name}": ${updateError.message}`)
          errors++
        } else {
          console.log(`✅ "${card.name}": ${foundCard.race || 'NULL'} → ${card.races}`)
          updated++
        }
      }
    } catch (error) {
      console.log(`❌ Error procesando "${card.name}": ${error}`)
      errors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN')
  console.log('='.repeat(50))
  console.log(`✅ Actualizadas: ${updated}`)
  console.log(`⚠️  No encontradas: ${notFound}`)
  console.log(`❌ Errores: ${errors}`)
  console.log('='.repeat(50))
}

fixMultiRaceCards()
  .then(() => {
    console.log('\n✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

