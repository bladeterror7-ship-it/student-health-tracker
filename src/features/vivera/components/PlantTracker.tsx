import { motion } from 'framer-motion'
import { PLANT_STAGES } from '../constants'
import { plantStageIndex } from '../utils/goalCalculator'

type Props = {
  progressPercent: number
}

export default function PlantTracker({ progressPercent }: Props) {
  const stageIdx = plantStageIndex(progressPercent)
  const stage = PLANT_STAGES[stageIdx] ?? PLANT_STAGES[0]
  const nextStage = PLANT_STAGES[Math.min(stageIdx + 1, PLANT_STAGES.length - 1)]

  return (
    <section
      className="flex flex-col items-center rounded-2xl border border-vivera-secondary/25 bg-gradient-to-b from-vivera-secondary/5 to-white p-4 text-center shadow-sm"
      aria-labelledby="vivera-plant-heading"
    >
      <h4
        id="vivera-plant-heading"
        className="text-sm font-semibold text-slate-900"
      >
        🌱 Миний Vivera ургамал
      </h4>
      <p className="mb-3 text-[11px] text-slate-500">
        Зорилтодоо хүрэх тусам ургана
      </p>

      <motion.div
        key={stageIdx}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="relative flex size-28 items-center justify-center"
      >
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
          className="text-6xl"
          role="img"
          aria-label={stage.label}
        >
          {stage.emoji}
        </motion.span>
        {progressPercent >= 25 && (
          <motion.div
            className="absolute -right-1 top-2 size-3 rounded-full bg-vivera-secondary/60"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            aria-hidden
          />
        )}
      </motion.div>

      <p className="mt-2 text-sm font-semibold text-vivera-secondary">
        {stage.label}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {progressPercent}% ·{' '}
        {progressPercent < 100
          ? `Дараагийн: ${nextStage.emoji} ${nextStage.label}`
          : 'Баяр хүргэе! 🎉'}
      </p>

      <div className="mt-3 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-vivera-primary to-vivera-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </section>
  )
}
