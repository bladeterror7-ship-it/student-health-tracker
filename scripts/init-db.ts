import { ensureSchema } from '../api/_lib/db.js'

async function main() {
  await ensureSchema()
  console.log('Neon schema ready (students, portal, doctor_questions, clinical_exams).')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
