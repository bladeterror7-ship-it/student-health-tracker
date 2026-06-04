import type { RegisteredStudent } from '../types'

/** Эцэг эхийн холбогдсон сурагчтай тааруулах (имэйл эсвэл нэр). */
export function childMatchesRecord(
  child: RegisteredStudent | null | undefined,
  item: { studentEmail?: string; studentName: string },
): boolean {
  if (!child) return false
  const email = child.email.trim().toLowerCase()
  const name = child.fullName.trim().toLowerCase()
  const itemEmail = item.studentEmail?.trim().toLowerCase()
  const itemName = item.studentName.trim().toLowerCase()
  if (itemEmail && itemEmail === email) return true
  if (itemName === name) return true
  if (itemName && name.includes(itemName)) return true
  if (itemName && itemName.includes(name)) return true
  return false
}
