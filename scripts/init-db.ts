import { ensureSchema } from '../api/_lib/db.js'

async function main() {
  await ensureSchema()
  console.log('Neon schema ready (students table).')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
