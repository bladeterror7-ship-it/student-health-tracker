import { uid } from './uid'
import type { PsychSessionBooking } from '../types'

const STORAGE_KEY = 'psych-session-bookings-v1'

export const PSYCH_BOOKINGS_EVENT = 'psych-session-bookings-changed'

export function readPsychBookings(): PsychSessionBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PsychSessionBooking[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(list: PsychSessionBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent(PSYCH_BOOKINGS_EVENT))
}

export function appendPsychBooking(
  partial: Omit<PsychSessionBooking, 'id' | 'createdAt' | 'readByPsych'>,
): PsychSessionBooking {
  const row: PsychSessionBooking = {
    ...partial,
    id: uid('psy'),
    createdAt: new Date().toISOString(),
    readByPsych: false,
  }
  persist([row, ...readPsychBookings()])
  return row
}

export function markAllPsychBookingsRead(): void {
  const list = readPsychBookings().map((b) => ({
    ...b,
    readByPsych: true,
  }))
  persist(list)
}
