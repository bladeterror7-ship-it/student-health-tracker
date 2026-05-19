const STORAGE_KEY = 'pe-student-passwords-v1'

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persist(map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota */
  }
}

export function setStudentPassword(email: string, password: string) {
  const key = email.trim().toLowerCase()
  const map = readMap()
  map[key] = password
  persist(map)
}

export function verifyStudentPassword(email: string, password: string): boolean {
  const key = email.trim().toLowerCase()
  const stored = readMap()[key]
  if (stored == null) return false
  return stored === password
}
