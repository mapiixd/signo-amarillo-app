import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExpansionCards() {
  console.log('🔍 Verificando cartas de la edición "Kaiju VS Mecha: Titanes"...\n')

  // Buscar con diferentes variantes del nombre
  const expansionVariants = [
    'Kaiju VS Mecha: Titanes',
    'Kvsm Titanes',
    'kvsm titanes',
    'KVSM Titanes',
    'Kaiju VS Mecha Titanes'
  ]

  for (const expansion of expansionVariants) {
    const { data: cards, error, count } = await supabase
      .from('cards')
      .select('*', { count: 'exact' })
      .ilike('expansion', expansion)

    if (error) {
      console.log(`❌ Error buscando "${expansion}": ${error.message}`)
      continue
    }

    if (cards && cards.length > 0) {
      console.log(`✅ Encontradas ${count} cartas con expansión: "${expansion}"`)
      console.log(`   Primeras 5 cartas:`)
      cards.slice(0, 5).forEach((card, idx) => {
        console.log(`   ${idx + 1}. ${card.name} (${card.type}, ${card.rarity})`)
      })
      if (cards.length > 5) {
        console.log(`   ... y ${cards.length - 5} más`)
      }
      console.log('')
    } else {
      console.log(`⚠️  No se encontraron cartas con expansión: "${expansion}"\n`)
    }
  }

  // También buscar todas las expansiones que contengan "titanes" o "kvsm"
  console.log('\n🔍 Buscando todas las expansiones que contengan "titanes" o "kvsm"...\n')
  
  const { data: allCards, error: allError } = await supabase
    .from('cards')
    .select('expansion')
    .or('expansion.ilike.%titanes%,expansion.ilike.%kvsm%')

  if (allError) {
    console.log(`❌ Error: ${allError.message}`)
  } else if (allCards) {
    const uniqueExpansions = new Set(allCards.map(c => c.expansion))
    console.log(`📊 Expansiones encontradas que contienen "titanes" o "kvsm":`)
    uniqueExpansions.forEach(exp => {
      const count = allCards.filter(c => c.expansion === exp).length
      console.log(`   - "${exp}": ${count} cartas`)
    })
  }

  // Contar total de cartas únicas
  const { data: uniqueCards, error: uniqueError } = await supabase
    .from('cards')
    .select('id, name, expansion')
    .or('expansion.ilike.%titanes%,expansion.ilike.%kvsm%')

  if (!uniqueError && uniqueCards) {
    console.log(`\n📊 Total de cartas únicas: ${uniqueCards.length}`)
  }
}

checkExpansionCards()
  .then(() => {
    console.log('\n✨ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

