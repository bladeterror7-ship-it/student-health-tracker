import { motion } from 'framer-motion'
import { PLANT_STAGES } from '../constants'
import type { WeekDayEntry } from '../utils/weeklyStats'

type Props = {
  days: WeekDayEntry[]
}

export default function PlantGrowthTimeline({ days }: Props) {
  return (
    <div className="mt-4 border-t border-slate-200/80 pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Ургамлын өсөлтийн хугацаа (0% → 100%)
      </p>
      <ol className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, i) => (
          <motion.li
            key={day.dateKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex flex-col items-center rounded-xl border px-1 py-2 text-center sm:px-2 ${
              day.isToday
                ? 'border-vivera-primary/40 bg-vivera-primary/5 shadow-sm'
                : day.isFuture
                  ? 'border-slate-100 bg-slate-50/80 opacity-50'
                  : day.goalMet
                    ? 'border-vivera-secondary/25 bg-vivera-secondary/5'
                    : 'border-slate-200 bg-white'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-500">{day.dayLabel}</span>
            <motion.span
              className="my-1 text-xl sm:text-2xl"
              animate={day.isToday ? { scale: [1, 1.08, 1] } : undefined}
              transition={{ repeat: day.isToday ? Infinity : 0, duration: 2 }}
              aria-hidden
            >
              {day.isFuture ? '·' : day.plantEmoji}
            </motion.span>
            <span className="text-[9px] font-semibold tabular-nums text-vivera-primary sm:text-[10px]">
              {day.isFuture ? '—' : `${day.fillPercent}%`}
            </span>
            {!day.isFuture && (
              <span className="mt-0.5 line-clamp-1 text-[8px] text-slate-400 sm:text-[9px]">
                {(PLANT_STAGES[day.plantStageIndex] ?? PLANT_STAGES[0]).label}
              </span>
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
