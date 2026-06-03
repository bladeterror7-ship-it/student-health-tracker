import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, HeartPulse, Lightbulb, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { EmotionDetail } from '../data/emotionData'

const SECTIONS = [
  {
    key: 'definition',
    title: 'Тодорхойлолт',
    icon: BookOpen,
    field: 'definition' as const,
    tone: 'from-sky-500/15 to-violet-500/10 border-sky-300/40',
  },
  {
    key: 'impact',
    title: 'Нөлөөлөл / Ач холбогдол',
    icon: HeartPulse,
    field: 'impact' as const,
    tone: 'from-violet-500/15 to-fuchsia-500/10 border-violet-300/40',
  },
  {
    key: 'coping',
    title: 'Зохицуулах / Хэрэгтэй зүйлс',
    icon: Lightbulb,
    field: 'coping' as const,
    tone: 'from-emerald-500/15 to-teal-500/10 border-emerald-300/40',
  },
]

export default function PsychEmotionModal({
  emotion,
  onClose,
}: {
  emotion: EmotionDetail | null
  onClose: () => void
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {emotion ? (
        <motion.div
          key={emotion.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="psych-emotion-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            aria-label="Хаах"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-[1] max-h-[min(88vh,640px)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-violet-300/45 bg-gradient-to-b from-white/95 to-violet-50/90 p-5 shadow-2xl dark:border-violet-400/30 dark:from-slate-950/95 dark:to-violet-950/80 sm:p-6"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full border border-slate-200/80 bg-white/90 p-2 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-black/40 dark:text-violet-100"
              aria-label="Хаах"
            >
              <X className="size-4" />
            </button>

            <div className="mb-5 flex items-center gap-3 pr-10">
              <span className="flex size-14 items-center justify-center rounded-2xl border border-violet-300/40 bg-violet-500/10 text-4xl shadow-inner">
                {emotion.emoji}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  Сэтгэл хөдлөл
                </p>
                <h2
                  id="psych-emotion-title"
                  className="text-xl font-semibold text-slate-900 dark:text-white"
                >
                  {emotion.title}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {SECTIONS.map((sec, i) => {
                const Icon = sec.icon
                return (
                  <motion.div
                    key={sec.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-2xl border bg-gradient-to-br p-4 ${sec.tone} dark:border-white/10`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-white/70 text-violet-700 dark:bg-black/35 dark:text-violet-200">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-violet-100">
                        {sec.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-emerald-50/90">
                      {emotion[sec.field]}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
