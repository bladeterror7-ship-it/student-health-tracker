const HISTORY_SUFFIX = 'history'

function historyKey(email: string) {
  return `vivera-water-v2:${email.toLowerCase()}:${HISTORY_SUFFIX}`
}

export type WaterHistory = Record<string, number>

export function loadWaterHistory(email: string): WaterHistory {
  try {
    const raw = localStorage.getItem(historyKey(email))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as WaterHistory
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveWaterHistoryEntry(
  email: string,
  dateKey: string,
  ml: number,
): void {
  try {
    const history = loadWaterHistory(email)
    history[dateKey] = Math.max(0, ml)
    const keys = Object.keys(history).sort()
    if (keys.length > 60) {
      for (const k of keys.slice(0, keys.length - 60)) {
        delete history[k]
      }
    }
    localStorage.setItem(historyKey(email), JSON.stringify(history))
  } catch {
    /* quota */
  }
}
