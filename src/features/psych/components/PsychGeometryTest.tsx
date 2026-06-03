import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, Shapes } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  GEOMETRY_INTRO,
  PSYCH_GEOMETRY_SHAPES,
  type GeometryShape,
  type GeometryShapeId,
} from '../data/geometryData'
import GeometryShapeIcon from './GeometryShapeIcon'
import { PsychSectionShell } from './PsychSectionShell'

type Phase = 'rank' | 'result'

const RANK_LABELS: Record<number, string> = {
  1: 'Үндсэн зан төлөв',
  2: 'Нөлөөлөх хүчин зүйл (2)',
  3: 'Нөлөөлөх хүчин зүйл (3)',
  4: 'Нөлөөлөх хүчин зүйл (4)',
  5: 'Илэрч болох бэрхшээл',
}

function traitForRank(shape: GeometryShape, rank: number): string {
  if (rank === 1) return shape.mainTrait
  if (rank === 5) return shape.challengeTrait
  return shape.influenceTrait
}

export default function PsychGeometryTest() {
  const [phase, setPhase] = useState<Phase>('rank')
  const [ranks, setRanks] = useState<Partial<Record<GeometryShapeId, number>>>({})
  const [pickingRank, setPickingRank] = useState(1)

  const assignedCount = Object.keys(ranks).length
  const allDone = assignedCount === PSYCH_GEOMETRY_SHAPES.length

  const orderedResults = useMemo(() => {
    if (!allDone) return []
    return ([1, 2, 3, 4, 5] as const)
      .map((rank) => {
        const shape = PSYCH_GEOMETRY_SHAPES.find((s) => ranks[s.id] === rank)
        if (!shape) return null
        return { rank, shape, text: traitForRank(shape, rank) }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [ranks, allDone])

  function assignShape(id: GeometryShapeId) {
    if (ranks[id] != null) return
    setRanks((prev) => ({ ...prev, [id]: pickingRank }))
    if (pickingRank < 5) {
      setPickingRank((r) => r + 1)
    }
  }

  function removeShape(id: GeometryShapeId) {
    const removed = ranks[id]
    if (removed == null) return
    const next: Partial<Record<GeometryShapeId, number>> = { ...ranks }
    delete next[id]
    for (const sid of PSYCH_GEOMETRY_SHAPES.map((s) => s.id)) {
      const r = next[sid]
      if (r != null && r > removed) next[sid] = r - 1
    }
    setRanks(next)
    setPickingRank(removed)
    setPhase('rank')
  }

  function reset() {
    setRanks({})
    setPickingRank(1)
    setPhase('rank')
  }

  function showResults() {
    if (allDone) setPhase('result')
  }

  return (
    <PsychSectionShell
      icon={Shapes}
      title={GEOMETRY_INTRO.title}
      subtitle={GEOMETRY_INTRO.description}
    >
      <AnimatePresence mode="wait">
        {phase === 'rank' && (
          <motion.div
            key="rank"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-violet-300/35 bg-violet-500/10 px-4 py-3 text-center dark:border-violet-400/25 dark:bg-violet-500/15">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">
                Одоогийн алхам
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {allDone ? 'Бүх дүрс сонгогдлоо' : `${pickingRank}-р сонголт`}
              </p>
              {!allDone && (
                <p className="mt-1 text-xs text-slate-600 dark:text-violet-100/65">
                  {RANK_LABELS[pickingRank]}
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {PSYCH_GEOMETRY_SHAPES.map((shape) => {
                const rank = ranks[shape.id]
                const taken = rank != null
                const disabled = taken || (allDone && !taken)
                return (
                  <motion.button
                    key={shape.id}
                    type="button"
                    disabled={disabled && !taken}
                    onClick={() => (taken ? removeShape(shape.id) : assignShape(shape.id))}
                    whileHover={!disabled || taken ? { y: -2 } : undefined}
                    whileTap={!disabled || taken ? { scale: 0.98 } : undefined}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      taken
                        ? 'border-violet-500/55 bg-white/95 ring-2 ring-violet-500/25 dark:border-violet-400/45 dark:bg-white/10'
                        : disabled
                          ? 'cursor-not-allowed border-white/30 bg-white/30 opacity-50 dark:border-white/5 dark:bg-black/15'
                          : 'border-white/55 bg-white/65 hover:border-violet-400/40 hover:bg-white/90 dark:border-white/10 dark:bg-black/25 dark:hover:border-violet-400/35'
                    }`}
                  >
                    <GeometryShapeIcon id={shape.id} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {shape.label}
                      </p>
                      {taken ? (
                        <p className="text-xs text-violet-700 dark:text-violet-200">
                          {rank}-р байр · дарж цуцлах
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-violet-100/55">
                          Дарж сонгоно уу
                        </p>
                      )}
                    </div>
                    {taken && (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                        {rank}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {allDone ? (
              <button
                type="button"
                onClick={showResults}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg"
              >
                <Check className="size-4" />
                Үр дүн харах
              </button>
            ) : (
              <p className="text-center text-xs text-slate-500 dark:text-violet-100/55">
                {5 - assignedCount} дүрс үлдлээ
              </p>
            )}
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {orderedResults.map((item, i) => (
              <motion.article
                key={item.shape.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 rounded-2xl border border-violet-300/40 bg-white/80 p-4 dark:border-violet-400/30 dark:bg-black/25"
              >
                <div className="flex flex-col items-center gap-1">
                  <GeometryShapeIcon id={item.shape.id} className="size-10" />
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {item.rank}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                    {RANK_LABELS[item.rank]}
                  </p>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                    {item.shape.label}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-emerald-50/88">
                    {item.text}
                  </p>
                </div>
              </motion.article>
            ))}
            <button
              type="button"
              onClick={reset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/50 bg-white/70 px-4 py-2.5 text-sm font-semibold text-violet-900 dark:border-violet-400/35 dark:bg-black/30 dark:text-violet-100"
            >
              <RotateCcw className="size-4" />
              Дахин эрэмбэлэх
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PsychSectionShell>
  )
}
