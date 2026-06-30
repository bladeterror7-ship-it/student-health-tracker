import { MEDICAL_CHANGED_EVENT } from './medicalStorage'
import { NOTIFICATIONS_CHANGED_EVENT } from './notificationsStorage'
import { PE_RECORDS_EVENT } from './peRecordsStorage'
import {
  PSYCH_GRATITUDE_LOGS_EVENT,
  PSYCH_MOOD_LOGS_EVENT,
} from './psychActivityStorage'
import { PSYCH_BOOKINGS_EVENT } from './psychBookingsStorage'
import { PSYCH_STRESS_TIPS_EVENT } from './psychStressTipsStorage'
import { TEACHER_TUTORIAL_EVENT } from './teacherTutorialStorage'

/** Session зэрэг төхөөрөмжийн local-only түлхүүрүүд */
export const STORAGE_SYNC_EXCLUDE_KEYS = new Set(['pe-session-v1'])

export const APP_STORAGE_SYNCED_EVENT = 'wellbe-app-storage-synced'

const REFRESH_EVENTS = [
  MEDICAL_CHANGED_EVENT,
  NOTIFICATIONS_CHANGED_EVENT,
  PE_RECORDS_EVENT,
  PSYCH_MOOD_LOGS_EVENT,
  PSYCH_GRATITUDE_LOGS_EVENT,
  PSYCH_BOOKINGS_EVENT,
  PSYCH_STRESS_TIPS_EVENT,
  TEACHER_TUTORIAL_EVENT,
  APP_STORAGE_SYNCED_EVENT,
] as const

export function shouldSyncStorageKey(key: string): boolean {
  if (!key || STORAGE_SYNC_EXCLUDE_KEYS.has(key)) return false
  return true
}

export function collectLocalStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && shouldSyncStorageKey(key)) keys.push(key)
  }
  return keys
}

export function broadcastStorageRefresh(): void {
  for (const eventName of REFRESH_EVENTS) {
    window.dispatchEvent(new CustomEvent(eventName))
  }
}
