import type { PsychMoodLog, RegisteredStudent } from '../types'

const WINDOW_DAYS = 7
const CONSECUTIVE_RISK_DAYS = 3
const MOOD_DROP_THRESHOLD = 5

const RISK_MOOD_IDS = new Set(['stressed', 'sad'])

export const ANON_STUDENT_AT_RISK_LABEL = '🔒 Сурагч (Нэр нууцалсан)'

export type AtRiskStudent = {
  studentEmail: string
  studentId: string | null
  classGroup: string
  displayName: string
  isAnonymous: boolean
  reasons: string[]
}

type DayMood = {
  dateKey: string
  moodId: string
  moodScore: number
  moodLabelMn: string
  isAnonymous: boolean
}

function dateKeyFromIso(iso: string): string {
  return iso.slice(0, 10)
}

function addCalendarDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

function isConsecutiveCalendarDay(prev: string, next: string): boolean {
  const a = new Date(`${prev}T12:00:00`)
  const b = new Date(`${next}T12:00:00`)
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000)
  return diff === 1
}

function isRiskMood(moodId: string): boolean {
  return RISK_MOOD_IDS.has(moodId)
}

/** Сүүлийн 7 хоногийн лог — өдөр бүр хамгийн доод оноотой сонголтыг авна. */
function buildStudentDayMaps(
  logs: readonly PsychMoodLog[],
  windowStartKey: string,
): Map<string, Map<string, DayMood>> {
  const byStudent = new Map<string, Map<string, DayMood>>()

  for (const log of logs) {
    const dk = dateKeyFromIso(log.createdAt)
    if (dk < windowStartKey) continue

    const email = log.studentEmail.toLowerCase()
    if (!byStudent.has(email)) byStudent.set(email, new Map())
    const days = byStudent.get(email)!

    const prev = days.get(dk)
    const anon = Boolean(log.isAnonymous)
    if (!prev || log.moodScore < prev.moodScore) {
      days.set(dk, {
        dateKey: dk,
        moodId: log.moodId,
        moodScore: log.moodScore,
        moodLabelMn: log.moodLabelMn,
        isAnonymous: anon,
      })
    } else if (anon) {
      prev.isAnonymous = true
    }
  }

  return byStudent
}

function maxConsecutiveRiskDays(sortedDays: DayMood[]): number {
  let streak = 0
  let max = 0
  let prevDate: string | null = null

  for (const day of sortedDays) {
    const risk = isRiskMood(day.moodId)
    const consecutive =
      prevDate != null && isConsecutiveCalendarDay(prevDate, day.dateKey)

    if (risk && (prevDate == null || consecutive)) {
      streak += 1
      max = Math.max(max, streak)
    } else if (risk) {
      streak = 1
      max = Math.max(max, streak)
    } else {
      streak = 0
    }
    prevDate = day.dateKey
  }

  return max
}

function findSharpDropReason(sortedDays: DayMood[]): string | null {
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = sortedDays[i - 1]!
    const curr = sortedDays[i]!
    if (!isConsecutiveCalendarDay(prev.dateKey, curr.dateKey)) continue
    const drop = prev.moodScore - curr.moodScore
    if (drop > MOOD_DROP_THRESHOLD) {
      return `Нэг өдөрт сэтгэл ${drop} оноогоор буурсан (${prev.moodScore} → ${curr.moodScore})`
    }
  }
  return null
}

function consecutiveDistressReason(
  streak: number,
  lastLabel: string,
): string {
  if (streak >= CONSECUTIVE_RISK_DAYS) {
    return `${streak} өдөр дараалан «Стресс» эсвэл «Гунигтай» сонголт`
  }
  return `${streak} өдөр дараалан ${lastLabel} — хяналтад авна уу`
}

function resolveStudentMeta(
  email: string,
  sampleLog: PsychMoodLog,
  registry: readonly RegisteredStudent[],
): Pick<AtRiskStudent, 'studentId' | 'classGroup' | 'displayName' | 'isAnonymous'> {
  const reg = registry.find(
    (s) => s.email.toLowerCase() === email && s.status === 'active',
  )
  const isAnonymous = Boolean(sampleLog.isAnonymous)

  return {
    studentId: reg?.id ?? null,
    classGroup: reg?.classGroup ?? '—',
    displayName: isAnonymous ? ANON_STUDENT_AT_RISK_LABEL : sampleLog.studentName,
    isAnonymous,
  }
}

/**
 * Сүүлийн 7 хоногийн mood логийг шинжилж эрсдэлтэй сурагчдыг олно.
 * - 3+ дараалан өдөр «Стресс» / «Гунигтай»
 * - Нэг өдөрт оноо 5+ оноогоор буурсан
 */
export function computeAtRiskStudents(
  moodLogs: readonly PsychMoodLog[],
  registryStudents: readonly RegisteredStudent[] = [],
  now = new Date(),
): AtRiskStudent[] {
  const windowStart = addCalendarDays(now, -(WINDOW_DAYS - 1))
  const windowStartKey = dateKeyFromIso(windowStart.toISOString())

  const byStudent = buildStudentDayMaps(moodLogs, windowStartKey)
  const results: AtRiskStudent[] = []

  for (const [email, dayMap] of byStudent) {
    const sortedDays = [...dayMap.values()].sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    )
    if (sortedDays.length === 0) continue

    const reasons: string[] = []
    const streak = maxConsecutiveRiskDays(sortedDays)
    if (streak >= CONSECUTIVE_RISK_DAYS) {
      const lastRisk = [...sortedDays].reverse().find((d) => isRiskMood(d.moodId))
      reasons.push(
        consecutiveDistressReason(
          streak,
          lastRisk?.moodLabelMn ?? 'доод сэтгэл',
        ),
      )
    }

    const dropReason = findSharpDropReason(sortedDays)
    if (dropReason) reasons.push(dropReason)

    if (reasons.length === 0) continue

    const sampleLog =
      moodLogs.find((l) => l.studentEmail.toLowerCase() === email) ?? ({
        studentEmail: email,
        studentName: email,
        isAnonymous: sortedDays.some((d) => d.isAnonymous),
      } as PsychMoodLog)

    results.push({
      studentEmail: email,
      ...resolveStudentMeta(email, sampleLog, registryStudents),
      reasons,
    })
  }

  return results.sort((a, b) => a.displayName.localeCompare(b.displayName, 'mn'))
}
