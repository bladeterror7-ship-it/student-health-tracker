import { useMemo } from 'react'
import { loadWaterHistory } from '../utils/waterHistory'
import { buildWeekDays, summarizeWeek, type WeeklyStatsSummary } from '../utils/weeklyStats'

export function useWeeklyStats(
  email: string | undefined,
  dailyGoalMl: number,
  todayIntakeMl: number,
): WeeklyStatsSummary {
  return useMemo(() => {
    const history = email ? loadWaterHistory(email) : {}
    const days = buildWeekDays(dailyGoalMl, history, {
      useMockForEmpty: true,
      todayIntakeMl,
    })
    return summarizeWeek(days)
  }, [email, dailyGoalMl, todayIntakeMl])
}
