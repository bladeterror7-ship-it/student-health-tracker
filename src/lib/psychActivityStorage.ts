import { uid } from './uid'
import type { PsychGratitudeLog, PsychMoodLog } from '../types'

const MOOD_KEY = 'psych-mood-logs-v1'
const GRATITUDE_KEY = 'psych-gratitude-logs-v1'

export const PSYCH_MOOD_LOGS_EVENT = 'psych-mood-logs-changed'
export const PSYCH_GRATITUDE_LOGS_EVENT = 'psych-gratitude-logs-changed'

function dispatch(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName))
}

export function readPsychMoodLogs(): PsychMoodLog[] {
  try {
    const raw = localStorage.getItem(MOOD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PsychMoodLog[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function readPsychGratitudeLogs(): PsychGratitudeLog[] {
  try {
    const raw = localStorage.getItem(GRATITUDE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PsychGratitudeLog[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistMood(list: PsychMoodLog[]) {
  try {
    localStorage.setItem(MOOD_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  dispatch(PSYCH_MOOD_LOGS_EVENT)
}

function persistGratitude(list: PsychGratitudeLog[]) {
  try {
    localStorage.setItem(GRATITUDE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  dispatch(PSYCH_GRATITUDE_LOGS_EVENT)
}

export function appendPsychMoodLog(
  partial: Omit<PsychMoodLog, 'id' | 'createdAt'>,
): PsychMoodLog {
  const row: PsychMoodLog = {
    ...partial,
    id: uid('mood'),
    createdAt: new Date().toISOString(),
  }
  persistMood([row, ...readPsychMoodLogs()])
  return row
}

export function appendPsychGratitudeLog(
  partial: Omit<PsychGratitudeLog, 'id' | 'createdAt'>,
): PsychGratitudeLog {
  const row: PsychGratitudeLog = {
    ...partial,
    id: uid('grat'),
    createdAt: new Date().toISOString(),
  }
  persistGratitude([row, ...readPsychGratitudeLogs()])
  return row
}
