import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActivityLevelId } from '../constants'
import { calculateDailyGoalMl } from '../utils/goalCalculator'
import { saveWaterHistoryEntry } from '../utils/waterHistory'

const STORAGE_PREFIX = 'vivera-water-v2:'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

type StoredDay = { dateKey: string; ml: number }

type StoredProfile = {
  weightKg: number
  activityId: ActivityLevelId
}

function storageKey(email: string, suffix: string) {
  return `${STORAGE_PREFIX}${email.toLowerCase()}:${suffix}`
}

function loadDay(email: string): number {
  try {
    const raw = localStorage.getItem(storageKey(email, 'day'))
    if (!raw) return 0
    const parsed = JSON.parse(raw) as StoredDay
    if (parsed.dateKey !== todayKey()) return 0
    return typeof parsed.ml === 'number' && parsed.ml >= 0 ? parsed.ml : 0
  } catch {
    return 0
  }
}

function persistDay(email: string, ml: number) {
  const key = todayKey()
  try {
    localStorage.setItem(
      storageKey(email, 'day'),
      JSON.stringify({ dateKey: key, ml } satisfies StoredDay),
    )
    saveWaterHistoryEntry(email, key, ml)
  } catch {
    /* quota */
  }
}

function loadProfile(email: string): StoredProfile {
  try {
    const raw = localStorage.getItem(storageKey(email, 'profile'))
    if (!raw) return { weightKg: 50, activityId: 'moderate' }
    const p = JSON.parse(raw) as Partial<StoredProfile>
    const weightKg =
      typeof p.weightKg === 'number' && p.weightKg > 0 ? p.weightKg : 50
    const activityId =
      p.activityId === 'low' || p.activityId === 'high' || p.activityId === 'moderate'
        ? p.activityId
        : 'moderate'
    return { weightKg, activityId }
  } catch {
    return { weightKg: 50, activityId: 'moderate' }
  }
}

function persistProfile(email: string, profile: StoredProfile) {
  try {
    localStorage.setItem(storageKey(email, 'profile'), JSON.stringify(profile))
  } catch {
    /* quota */
  }
}

export function useViveraWater(email: string | undefined) {
  const [intakeMl, setIntakeMl] = useState(0)
  const [weightKg, setWeightKg] = useState(50)
  const [activityId, setActivityId] = useState<ActivityLevelId>('moderate')
  const [showHydrationWarning, setShowHydrationWarning] = useState(false)

  useEffect(() => {
    if (!email) {
      setIntakeMl(0)
      return
    }
    const profile = loadProfile(email)
    setWeightKg(profile.weightKg)
    setActivityId(profile.activityId)
    setIntakeMl(loadDay(email))
  }, [email])

  const dailyGoalMl = useMemo(
    () => calculateDailyGoalMl(weightKg, activityId),
    [weightKg, activityId],
  )

  const updateProfile = useCallback(
    (next: { weightKg: number; activityId: ActivityLevelId }) => {
      setWeightKg(next.weightKg)
      setActivityId(next.activityId)
      if (email) persistProfile(email, next)
    },
    [email],
  )

  const addWater = useCallback(
    (amountMl: number) => {
      if (amountMl >= 500) setShowHydrationWarning(true)
      setIntakeMl((prev) => {
        const next = Math.max(0, prev + amountMl)
        if (email) persistDay(email, next)
        return next
      })
    },
    [email],
  )

  const resetDay = useCallback(() => {
    setIntakeMl(0)
    setShowHydrationWarning(false)
    if (email) persistDay(email, 0)
  }, [email])

  const dismissWarning = useCallback(() => {
    setShowHydrationWarning(false)
  }, [])

  return {
    intakeMl,
    dailyGoalMl,
    weightKg,
    activityId,
    showHydrationWarning,
    updateProfile,
    addWater,
    resetDay,
    dismissWarning,
  }
}
