import { PLANT_STAGES } from '../constants'
import { plantStageIndex, progressPercent } from './goalCalculator'

export const WEEKDAY_LABELS_MN = [
  'Да',
  'Мя',
  'Лх',
  'Пү',
  'Ба',
  'Бя',
  'Ня',
] as const

export type WeekDayEntry = {
  dateKey: string
  dayLabel: string
  intakeMl: number
  goalMl: number
  goalMet: boolean
  fillPercent: number
  plantStageIndex: number
  plantEmoji: string
  isToday: boolean
  isFuture: boolean
}

export type WeeklyStatsSummary = {
  days: WeekDayEntry[]
  totalIntakeMl: number
  totalGoalMl: number
  weeklyPercent: number
  bestDay: WeekDayEntry
  goalStreak: number
  dailyGoalMl: number
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

/** ISO долоо хоногийн эхлэл: Даваа */
export function mondayOfWeek(ref = new Date()): Date {
  const d = new Date(ref)
  d.setHours(12, 0, 0, 0)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

export function buildWeekDateKeys(ref = new Date()): string[] {
  const monday = mondayOfWeek(ref)
  return WEEKDAY_LABELS_MN.map((_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return formatDateKey(day)
  })
}

/** Демо: долоо хоногийн жишээ өгөгдөл (өнөөдрийг бодит intake-аар солино) */
const MOCK_WEEK_INTAKE_ML = [1200, 900, 1500, 1100, 1800, 750, 1550]

export function buildWeekDays(
  dailyGoalMl: number,
  intakeByDate: Record<string, number>,
  options?: { useMockForEmpty?: boolean; todayIntakeMl?: number },
): WeekDayEntry[] {
  const todayKey = formatDateKey(new Date())
  const monday = mondayOfWeek()
  const useMock = options?.useMockForEmpty ?? true

  return WEEKDAY_LABELS_MN.map((dayLabel, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateKey = formatDateKey(d)
    const isToday = dateKey === todayKey
    const isFuture = dateKey > todayKey

    let intakeMl = intakeByDate[dateKey] ?? 0
    if (isFuture) {
      intakeMl = 0
    } else if (isToday && options?.todayIntakeMl != null) {
      intakeMl = options.todayIntakeMl
    } else if (intakeMl === 0 && useMock && !isFuture) {
      intakeMl = MOCK_WEEK_INTAKE_ML[i] ?? 0
      if (isToday && options?.todayIntakeMl != null) {
        intakeMl = options.todayIntakeMl
      }
    }

    const fillPercent = progressPercent(intakeMl, dailyGoalMl)
    const stageIdx = plantStageIndex(fillPercent)
    const stage = PLANT_STAGES[stageIdx] ?? PLANT_STAGES[0]

    return {
      dateKey,
      dayLabel,
      intakeMl,
      goalMl: dailyGoalMl,
      goalMet: intakeMl >= dailyGoalMl,
      fillPercent,
      plantStageIndex: stageIdx,
      plantEmoji: stage.emoji,
      isToday,
      isFuture,
    }
  })
}

export function summarizeWeek(days: WeekDayEntry[]): WeeklyStatsSummary {
  const pastOrToday = days.filter((d) => !d.isFuture)
  const totalIntakeMl = pastOrToday.reduce((s, d) => s + d.intakeMl, 0)
  const totalGoalMl = pastOrToday.reduce((s, d) => s + d.goalMl, 0)
  const weeklyPercent =
    totalGoalMl > 0 ? Math.min(100, Math.round((totalIntakeMl / totalGoalMl) * 100)) : 0

  const bestDay = pastOrToday.reduce(
    (best, d) => (d.intakeMl > best.intakeMl ? d : best),
    pastOrToday[0] ?? days[0]!,
  )

  let goalStreak = 0
  let run = 0
  for (const d of days) {
    if (d.isFuture) break
    if (d.goalMet) {
      run += 1
      goalStreak = Math.max(goalStreak, run)
    } else {
      run = 0
    }
  }

  return {
    days,
    totalIntakeMl,
    totalGoalMl,
    weeklyPercent,
    bestDay,
    goalStreak,
    dailyGoalMl: days[0]?.goalMl ?? 2000,
  }
}

export function formatLiters(ml: number, digits = 1): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(digits)}л`
  return `${ml} мл`
}
