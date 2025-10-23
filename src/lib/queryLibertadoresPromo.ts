import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function queryLibertadoresPromo() {
  const { data, error } = await supabase
    .from('cards')
    .select('name, rarity, expansion, image_file, race')
    .eq('expansion', 'Libertadores')
    .eq('rarity', 'PROMO')
    .order('image_file')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n🏆 CARTAS PROMO DE LIBERTADORES\n')
  console.log('='.repeat(60))
  
  data?.forEach((card, index) => {
    console.log(`${index + 1}. ${card.name}`)
    console.log(`   - EDID: ${card.image_file}`)
    console.log(`   - Raza: ${card.race || 'N/A'}`)
    console.log('')
  })
  
  console.log('='.repeat(60))
  console.log(`Total: ${data?.length || 0} cartas\n`)
}

queryLibertadoresPromo()

