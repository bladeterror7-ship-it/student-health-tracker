import { ACTIVITY_OPTIONS, ML_PER_KG, type ActivityLevelId } from '../constants'

export function calculateDailyGoalMl(
  weightKg: number,
  activityId: ActivityLevelId = 'moderate',
): number {
  const w = Number(weightKg)
  if (!Number.isFinite(w) || w <= 0) return 2000

  const activity = ACTIVITY_OPTIONS.find((a) => a.id === activityId)
  const multiplier = activity?.multiplier ?? 1
  return Math.round(w * ML_PER_KG * multiplier)
}

export function progressPercent(intakeMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0
  return Math.min(100, Math.round((intakeMl / goalMl) * 100))
}

export function plantStageIndex(percent: number): number {
  const p = Math.max(0, Math.min(100, percent))
  if (p >= 100) return 4
  if (p >= 75) return 3
  if (p >= 50) return 2
  if (p >= 25) return 1
  return 0
}
