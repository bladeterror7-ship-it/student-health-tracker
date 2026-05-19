import { motion } from 'framer-motion'
import { Wind } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale'

const PHASE_LABELS: Record<Exclude<Phase, 'idle'>, string> = {
  inhale: 'Орох амьсгал — 4 сек',
  hold: 'Хүлээх — 4 сек',
  exhale: 'Гаргах амьсгал — 4 сек',
}

export default function StudentPsychBreathing() {
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const runningRef = useRef(false)

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    if (!running) return

    let cancelled = false
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms)
      })

    async function cycle() {
      while (!cancelled && runningRef.current) {
        setPhase('inhale')
        await wait(4000)
        if (cancelled || !runningRef.current) break
        setPhase('hold')
        await wait(4000)
        if (cancelled || !runningRef.current) break
        setPhase('exhale')
        await wait(4000)
        if (cancelled || !runningRef.current) break
      }
    }

    void cycle()
    return () => {
      cancelled = true
    }
  }, [running])

  const targetScale =
    !running ? 1 : phase === 'exhale' || phase === 'idle' ? 1 : 1.38

  const scaleTransition =
    !running
      ? { duration: 0.35, ease: 'easeOut' as const }
      : phase === 'hold'
        ? { duration: 0 }
        : { duration: 4, ease: 'easeInOut' as const }

  const phaseLabel =
    phase === 'idle' ? 'Эхлүүлээд аажмаар амьсаарай' : PHASE_LABELS[phase]

  return (
    <div className="rounded-2xl border border-sky-400/40 bg-gradient-to-br from-sky-500/18 via-white/45 to-violet-500/14 p-4 shadow-sm backdrop-blur-xl dark:border-sky-400/25 dark:from-sky-500/18 dark:via-white/[0.04] dark:to-violet-500/18 sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/35 bg-sky-500/15 text-sky-800 shadow-sm dark:border-sky-400/30 dark:bg-sky-500/20 dark:text-sky-100">
          <Wind className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 text-left">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Амьсгалын дасгал
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-sky-100/65">
            4–4–4 секундын орж, хүлээж, гаргах горим — тайвнаараа анхаарлаа буцаана.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative flex size-36 items-center justify-center sm:size-40">
          <motion.div
            className="absolute inset-6 rounded-full bg-gradient-to-br from-violet-400/45 to-sky-400/40 blur-xl"
            animate={
              running
                ? { opacity: phase === 'hold' ? 0.85 : 0.55, scale: 1.05 }
                : { opacity: 0.35, scale: 1 }
            }
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="relative flex size-full max-h-[9.5rem] max-w-[9.5rem] items-center justify-center rounded-full border-2 border-violet-400/45 bg-white/60 shadow-inner dark:border-violet-400/35 dark:bg-black/35"
            animate={
              running
                ? {
                    scale: targetScale,
                  }
                : { scale: 1 }
            }
            transition={scaleTransition}
          >
            <span className="pointer-events-none text-center text-[11px] font-semibold leading-snug text-violet-900/90 dark:text-violet-100/90">
              {phase === 'idle' ? (
                <>
                  Эхлэх
                  <br />
                  <span className="font-normal opacity-75">доорх товч</span>
                </>
              ) : (
                <>
                  {phase === 'inhale' && 'Орох'}
                  {phase === 'hold' && 'Хүлээ'}
                  {phase === 'exhale' && 'Гаргах'}
                </>
              )}
            </span>
          </motion.div>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-3 text-left">
          <p className="text-xs font-medium text-slate-700 dark:text-sky-50/85">
            {phaseLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {!running ? (
              <motion.button
                type="button"
                onClick={() => {
                  setPhase('inhale')
                  setRunning(true)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25"
              >
                Эхлэх
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => {
                  setRunning(false)
                  setPhase('idle')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-slate-200/90 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/15 dark:bg-black/35 dark:text-sky-50"
              >
                Зогсоох
              </motion.button>
            )}
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-sky-100/45">
            Хүүхэн доош харж, хүзүүний напалгыг сулруулна уу. Өвдөлт мэдэрвэл зогсоно.
          </p>
        </div>
      </div>
    </div>
  )
}
