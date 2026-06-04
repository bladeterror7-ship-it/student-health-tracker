import { uid } from './uid'
import type { PERecord } from '../types'

const LS_PE = 'pe-shared-pe-records-v1'
export const PE_RECORDS_EVENT = 'pe-records-changed'

function dispatch() {
  window.dispatchEvent(new CustomEvent(PE_RECORDS_EVENT))
}

export function readPeRecords(): PERecord[] {
  try {
    const raw = localStorage.getItem(LS_PE)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PERecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function persistPeRecords(rows: PERecord[]) {
  try {
    localStorage.setItem(LS_PE, JSON.stringify(rows))
  } catch {
    /* quota */
  }
  dispatch()
}

export function upsertPeRecord(row: Omit<PERecord, 'id'> & { id?: string }): PERecord {
  const full: PERecord = {
    id: row.id ?? uid('pe'),
    studentName: row.studentName.trim(),
    date: row.date,
    activity: row.activity.trim(),
    score: row.score,
  }
  const prev = readPeRecords()
  const exists = row.id && prev.some((r) => r.id === row.id)
  const next = exists
    ? prev.map((r) => (r.id === full.id ? full : r))
    : [full, ...prev]
  persistPeRecords(next)
  return full
}

export function deletePeRecord(id: string) {
  persistPeRecords(readPeRecords().filter((r) => r.id !== id))
}
