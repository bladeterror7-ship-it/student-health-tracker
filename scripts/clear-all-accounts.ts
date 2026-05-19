/**
 * Бүх сурагч, админ, эцэг эхийн бүртгэлийг Neon DB-ээс устгана.
 * Ажиллуулах: npm run db:clear
 */
import { getSql, ensureSchema } from '../api/_lib/db.js'

async function main() {
  await ensureSchema()
  const sql = getSql()

  const portal = await sql`DELETE FROM portal_accounts`
  const students = await sql`DELETE FROM students`

  console.log('Устгагдлаа:')
  console.log(`  portal_accounts: ${portal.count ?? 'OK'}`)
  console.log(`  students: ${students.count ?? 'OK'}`)
}

main().catch((error) => {
  console.error('Алдаа:', error)
  process.exit(1)
})
