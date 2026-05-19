import { uid } from './uid'

const STORAGE_KEY = 'psych-stress-tips-v1'

export const PSYCH_STRESS_TIPS_EVENT = 'psych-stress-tips-changed'

export type PsychStressTip = {
  id: string
  text: string
  createdAt: string
}

function dispatch() {
  window.dispatchEvent(new CustomEvent(PSYCH_STRESS_TIPS_EVENT))
}

export function readPsychStressTips(): PsychStressTip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PsychStressTip[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((t) => t?.id && typeof t.text === 'string' && t.text.trim())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  } catch {
    return []
  }
}

function persist(list: PsychStressTip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  dispatch()
}

export function addPsychStressTip(text: string): PsychStressTip {
  const row: PsychStressTip = {
    id: uid('stip'),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
  persist([row, ...readPsychStressTips()])
  return row
}

export function removePsychStressTip(id: string) {
  persist(readPsychStressTips().filter((t) => t.id !== id))
}
