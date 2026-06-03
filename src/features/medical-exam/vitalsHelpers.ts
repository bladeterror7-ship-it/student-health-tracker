import type { ClinicalExamState } from './types'

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Дээд даралтын баганы дүүргэлт % (60–200 mmHg) */
export function systolicGaugePercent(sys: number): number {
  if (sys <= 0) return 8
  return clamp(((sys - 60) / (200 - 60)) * 100, 8, 100)
}

/** Доод даралтын жижиг багана % (40–120 mmHg) */
export function diastolicGaugePercent(dia: number): number {
  if (dia <= 0) return 6
  return clamp(((dia - 40) / (120 - 40)) * 100, 6, 100)
}

export function isBloodPressureHigh(sys: number, dia: number): boolean {
  return sys >= 140 || dia >= 90
}

export function isPulseHigh(bpm: number): boolean {
  return bpm > 120
}

export function formatBloodPressure(state: ClinicalExamState): string {
  const { bpSystolic: sys, bpDiastolic: dia } = state
  if (sys <= 0 && dia <= 0) return '—'
  if (sys > 0 && dia > 0) return `${sys}/${dia} mmHg`
  if (sys > 0) return `${sys}/— mmHg`
  return `—/${dia} mmHg`
}

export function formatPulse(state: ClinicalExamState): string {
  return state.pulseBpm > 0 ? `${state.pulseBpm} BPM` : '—'
}

/** ECG долгионы нэг циклийн хугацаа (сек) — BPM өсөхөд хурдан */
export function ecgCycleDurationSec(bpm: number): number {
  const effective = bpm > 0 ? bpm : 72
  const base = 60 / effective
  if (effective > 120) return base * 0.45
  if (effective > 100) return base * 0.65
  return base * 0.85
}
