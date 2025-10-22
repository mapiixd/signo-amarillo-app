import { seedDatabase } from '../src/lib/seed'

async function main() {
  try {
    await seedDatabase()
  } catch (error) {
    console.error('Error during seeding:', error)
    process.exit(1)
  }
}

main()
