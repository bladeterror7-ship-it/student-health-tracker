import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'

type Props = {
  fillPercent: number
  intakeMl: number
  goalMl: number
}

export default function WaterFillMeter({
  fillPercent,
  intakeMl,
  goalMl,
}: Props) {
  const litersDisplay = (intakeMl / 1000).toFixed(intakeMl >= 1000 ? 1 : 2)
  const goalLiters = (goalMl / 1000).toFixed(1)

  return (
    <motion.div
      className="mx-auto flex w-full max-w-[8.5rem] flex-col items-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="relative h-52 w-24 overflow-hidden rounded-t-[2rem] rounded-b-3xl border-2 border-vivera-primary/35 bg-white shadow-inner sm:h-56 sm:w-28"
        role="progressbar"
        aria-valuenow={Math.round(fillPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Өдрийн усны түвшин"
      >
        <div
          className="absolute inset-x-3 top-3 z-[2] h-5 rounded-full border border-vivera-primary/25 bg-vivera-surface"
          aria-hidden
        />
        <div className="absolute inset-x-2 bottom-2 top-9 overflow-hidden rounded-b-[1.25rem] rounded-t-md">
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-b-[1.2rem] bg-gradient-to-t from-vivera-primary to-vivera-secondary shadow-[inset_0_2px_12px_rgba(255,255,255,0.35)]"
            initial={false}
            animate={{ height: `${fillPercent}%` }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-3 z-[2] text-center">
          <span className="text-[10px] font-bold tabular-nums text-vivera-primary">
            {Math.round(fillPercent)}%
          </span>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-600">
        <Droplets className="size-3.5 text-vivera-primary" aria-hidden />
        {litersDisplay}л / {goalLiters}л
      </p>
    </motion.div>
  )
}
