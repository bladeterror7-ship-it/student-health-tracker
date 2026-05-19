import { ensureSchema } from '../lib/server/db.js'

async function main() {
  await ensureSchema()
  console.log('Neon schema ready (students table).')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
