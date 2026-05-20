import { motion } from 'framer-motion'
import { Calculator, Droplets } from 'lucide-react'
import { ACTIVITY_OPTIONS, ML_PER_KG, type ActivityLevelId } from '../constants'
import { calculateDailyGoalMl } from '../utils/goalCalculator'

type Props = {
  weightKg: number
  activityId: ActivityLevelId
  dailyGoalMl: number
  onChange: (next: { weightKg: number; activityId: ActivityLevelId }) => void
}

export default function GoalCalculator({
  weightKg,
  activityId,
  dailyGoalMl,
  onChange,
}: Props) {
  return (
    <motion.section
      layout
      className="rounded-2xl border border-vivera-primary/15 bg-white p-4 shadow-sm"
      aria-labelledby="vivera-goal-heading"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-vivera-primary to-vivera-secondary text-white shadow-md">
          <Calculator className="size-4" aria-hidden />
        </span>
        <div>
          <h4
            id="vivera-goal-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Хувийн зорилго тооцоолуур
          </h4>
          <p className="text-[11px] text-slate-500">
            Жин × {ML_PER_KG} мл × идэвхийн түвшин
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-left">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Жин (кг)
          </span>
          <input
            type="number"
            min={20}
            max={200}
            step={1}
            value={weightKg}
            onChange={(e) =>
              onChange({
                weightKg: Math.max(20, Math.min(200, Number(e.target.value) || 50)),
                activityId,
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-vivera-surface px-3 py-2.5 text-sm font-medium text-slate-900 outline-none ring-vivera-primary/0 transition focus:border-vivera-primary/50 focus:ring-2 focus:ring-vivera-primary/20"
          />
        </label>
        <label className="block text-left">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Идэвхийн түвшин
          </span>
          <select
            value={activityId}
            onChange={(e) =>
              onChange({
                weightKg,
                activityId: e.target.value as ActivityLevelId,
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-vivera-surface px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-vivera-primary/50 focus:ring-2 focus:ring-vivera-primary/20"
          >
            {ACTIVITY_OPTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <motion.div
        layout
        className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-vivera-primary/10 to-vivera-secondary/10 px-3 py-2.5"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Droplets className="size-3.5 text-vivera-primary" aria-hidden />
          Өдрийн зорилт
        </span>
        <span className="text-base font-bold tabular-nums text-vivera-primary">
          {dailyGoalMl.toLocaleString('mn-MN')} мл
          <span className="ml-1 text-xs font-semibold text-slate-500">
            ({(dailyGoalMl / 1000).toFixed(1)} л)
          </span>
        </span>
      </motion.div>
      <p className="mt-2 text-[10px] text-slate-400">
        Тооцоолол: {weightKg} × {ML_PER_KG} ×{' '}
        {ACTIVITY_OPTIONS.find((a) => a.id === activityId)?.multiplier ?? 1} ={' '}
        {calculateDailyGoalMl(weightKg, activityId)} мл
      </p>
    </motion.section>
  )
}
