import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import PlantGrowthTimeline from './PlantGrowthTimeline'
import WeeklyChart from './WeeklyChart'
import WeeklySummaryCard from './WeeklySummaryCard'

type Props = {
  email: string | undefined
  dailyGoalMl: number
  todayIntakeMl: number
}

export default function WeeklyStats({
  email,
  dailyGoalMl,
  todayIntakeMl,
}: Props) {
  const summary = useWeeklyStats(email, dailyGoalMl, todayIntakeMl)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-vivera-primary/15 bg-vivera-surface p-4 shadow-md sm:p-5"
      aria-labelledby="vivera-weekly-heading"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-vivera-primary to-vivera-secondary text-white shadow-md">
          <BarChart3 className="size-4" aria-hidden />
        </span>
        <div>
          <h4
            id="vivera-weekly-heading"
            className="text-sm font-semibold text-slate-900 sm:text-base"
          >
            7 хоногийн статистик &amp; өсөлт
          </h4>
          <p className="text-[11px] text-slate-500">
            Даваа–Ням · усны хэрэглээ &amp; ургамлын ахиц
          </p>
        </div>
      </div>

      <WeeklySummaryCard summary={summary} />

      <div className="mt-5 rounded-xl border border-white bg-white p-3 shadow-sm sm:p-4">
        <WeeklyChart days={summary.days} dailyGoalMl={summary.dailyGoalMl} />
        <PlantGrowthTimeline days={summary.days} />
      </div>
    </motion.section>
  )
}
