import { motion } from 'framer-motion'
import { AlertTriangle, Heart } from 'lucide-react'
import { useMemo } from 'react'
import { ecgCycleDurationSec, isPulseHigh } from '../vitalsHelpers'
import type { ClinicalExamState } from '../types'

const ECG_SEGMENT =
  'M0,24 L8,24 L12,8 L18,40 L24,24 L40,24 L44,10 L52,38 L58,24 L74,24 L78,12 L86,36 L92,24 L108,24 L112,8 L120,40 L126,24 L142,24 L146,14 L154,34 L160,24 L176,24 L180,10 L188,38 L194,24 L210,24'

function parseBpm(raw: string): number {
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, 220)
}

export default function PulseEcgSection({
  state,
  onChange,
}: {
  state: ClinicalExamState
  onChange: (patch: Partial<ClinicalExamState>) => void
}) {
  const bpm = state.pulseBpm
  const displayBpm = bpm > 0 ? bpm : 72
  const high = isPulseHigh(bpm)
  const cycleSec = useMemo(() => ecgCycleDurationSec(bpm), [bpm])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl border border-pink-300/50 bg-pink-500/10 text-pink-700 dark:border-pink-400/30 dark:bg-pink-500/15 dark:text-pink-200">
          <Heart className="size-4" aria-hidden />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Пульс / Зүрхний цохилт (Pulse)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-pink-100/55">
            ECG монитор — BPM-ээс хамааран долгион хурдана
          </p>
        </div>
        {high && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800 dark:text-orange-200">
            <AlertTriangle className="size-3" />
            Өндөр пульс (&gt;120)
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <label className="block shrink-0 space-y-1.5 rounded-2xl border border-pink-200/60 bg-white/80 p-4 dark:border-pink-500/25 dark:bg-black/25 lg:min-w-[160px]">
          <span className="text-[11px] font-bold uppercase tracking-wide text-pink-800 dark:text-pink-200">
            BPM (цохилт/мин)
          </span>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              min={30}
              max={220}
              value={bpm > 0 ? bpm : ''}
              placeholder="72"
              onChange={(e) =>
                onChange({ pulseBpm: parseBpm(e.target.value) })
              }
              className="w-full max-w-[5.5rem] rounded-xl border border-pink-200/70 bg-white px-3 py-2 text-2xl font-bold tabular-nums text-slate-900 outline-none ring-pink-400/30 focus:ring-2 dark:border-white/15 dark:bg-black/40 dark:text-white"
            />
            <span className="text-xs font-semibold text-slate-500">BPM</span>
          </div>
        </label>

        {/* Эмнэлгийн монитор */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-3xl border border-slate-700/20 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-4 shadow-xl dark:border-emerald-500/20">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <motion.span
                className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{
                  duration: high ? 0.35 : 0.9,
                  repeat: Infinity,
                }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/90">
                ECG · Lead II
              </span>
            </div>
            <motion.p
              key={displayBpm}
              className="font-mono text-2xl font-bold tabular-nums text-emerald-300"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
            >
              {bpm > 0 ? bpm : '—'}
              <span className="ml-1 text-sm font-medium text-emerald-500/80">
                BPM
              </span>
            </motion.p>
          </div>

          <div className="relative h-28 overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/40">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(52,211,153,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.12) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <svg
              viewBox="0 0 220 48"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <line
                x1="0"
                y1="24"
                x2="220"
                y2="24"
                stroke="rgba(52,211,153,0.2)"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            </svg>
            <motion.div
              className="absolute inset-y-0 left-0 flex w-[200%]"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                duration: cycleSec,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <svg
                viewBox="0 0 220 48"
                className="h-full min-w-[50%] flex-none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d={ECG_SEGMENT}
                  fill="none"
                  stroke={high ? '#fb923c' : '#34d399'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={high ? 'drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]' : 'drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]'}
                />
              </svg>
              <svg
                viewBox="0 0 220 48"
                className="h-full min-w-[50%] flex-none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d={ECG_SEGMENT}
                  fill="none"
                  stroke={high ? '#fb923c' : '#34d399'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>

          <p className="mt-2 text-center text-[10px] text-emerald-600/70 dark:text-emerald-400/50">
            {bpm > 0
              ? high
                ? 'Долгион хурдсан — тахикарди шинжилгээ'
                : 'Хэвийн хүрээний долгион'
              : 'BPM оруулахад долгион эхэлнэ (урьдчилсан 72)'}
          </p>
        </div>
      </div>
    </section>
  )
}
