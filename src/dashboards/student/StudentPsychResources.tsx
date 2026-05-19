import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Ear,
  ExternalLink,
  Eye,
  Hand,
  Sparkles,
  Utensils,
  Wind,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import {
  PSYCH_STRESS_TIPS_EVENT,
  readPsychStressTips,
} from '../../lib/psychStressTipsStorage'

type ResourceId = 'grounding' | 'sleep' | 'stress'

const RESOURCES: { id: ResourceId; title: string }[] = [
  { id: 'grounding', title: 'Өөрийгөө зогсоох техник' },
  { id: 'sleep', title: 'Нойрны дадал' },
  { id: 'stress', title: 'Стрессийн менежмент' },
]

const GROUNDING_STEPS = [
  { n: 5, label: 'Харж болох зүйлс', Icon: Eye },
  { n: 4, label: 'Хүрч болох зүйлс', Icon: Hand },
  { n: 3, label: 'Сонсогдох чимээ', Icon: Ear },
  { n: 2, label: 'Үнэрлэх зүйл', Icon: Wind },
  { n: 1, label: 'Амтлах зүйл', Icon: Utensils },
] as const

const SLEEP_ITEMS = [
  'Унтахаас 1 цагийн өмнө утсаа холдуулах',
  'Өрөөгөө сэрүүн, харанхуй болгох',
  'Өдөр бүр тогтмол цагт унтах',
] as const

const SLEEP_STORAGE_PREFIX = 'psych-sleep-checklist-v1:'

function sleepStorageKey(email: string) {
  return `${SLEEP_STORAGE_PREFIX}${email.toLowerCase()}`
}

function loadSleepChecks(email: string): boolean[] {
  try {
    const raw = localStorage.getItem(sleepStorageKey(email))
    if (!raw) return SLEEP_ITEMS.map(() => false)
    const parsed = JSON.parse(raw) as boolean[]
    if (!Array.isArray(parsed) || parsed.length !== SLEEP_ITEMS.length) {
      return SLEEP_ITEMS.map(() => false)
    }
    return parsed
  } catch {
    return SLEEP_ITEMS.map(() => false)
  }
}

function persistSleepChecks(email: string, checks: boolean[]) {
  try {
    localStorage.setItem(sleepStorageKey(email), JSON.stringify(checks))
  } catch {
    /* quota */
  }
}

function GroundingPanel() {
  return (
    <ul className="space-y-2 pt-1">
      {GROUNDING_STEPS.map((step, i) => (
        <motion.li
          key={step.n}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.22 }}
          className="flex items-center gap-3 rounded-xl border border-sky-200/50 bg-white/70 px-3 py-2.5 dark:border-sky-500/20 dark:bg-black/25"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/25 to-violet-500/20 text-base font-bold tabular-nums text-sky-900 dark:text-sky-100">
            {step.n}
          </span>
          <step.Icon
            className="size-4 shrink-0 text-sky-600 dark:text-sky-300"
            aria-hidden
          />
          <span className="text-sm font-medium text-sky-950 dark:text-sky-50">
            {step.label}
          </span>
        </motion.li>
      ))}
    </ul>
  )
}

function SleepChecklistPanel({
  checks,
  onToggle,
}: {
  checks: boolean[]
  onToggle: (index: number) => void
}) {
  return (
    <ul className="space-y-2 pt-1">
      {SLEEP_ITEMS.map((label, i) => {
        const done = checks[i]
        return (
          <li key={label}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200/50 bg-white/70 px-3 py-2.5 transition hover:bg-white dark:border-sky-500/20 dark:bg-black/25 dark:hover:bg-black/35">
              <input
                type="checkbox"
                checked={done}
                onChange={() => onToggle(i)}
                className="mt-0.5 size-4 shrink-0 rounded border-sky-300 text-sky-600 focus:ring-sky-400/40"
              />
              <span
                className={`text-sm font-medium transition-all duration-300 ${
                  done
                    ? 'text-slate-400 line-through decoration-sky-500/70 decoration-2 dark:text-sky-100/40'
                    : 'text-sky-950 dark:text-sky-50'
                }`}
              >
                {label}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function StressTipsPanel({ tips }: { tips: string[] }) {
  if (tips.length === 0) {
    return (
      <p className="rounded-xl bg-white/60 px-3 py-4 text-center text-sm text-sky-900/70 dark:bg-black/25 dark:text-sky-100/55">
        Сэтгэл зүйч зөвлөмж нэмэхэд энд харагдана.
      </p>
    )
  }

  return (
    <ul className="space-y-2 pt-1">
      {tips.map((tip, i) => (
        <motion.li
          key={`${tip}-${i}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-start gap-2 rounded-xl border border-violet-200/45 bg-white/75 px-3 py-2.5 dark:border-violet-500/20 dark:bg-black/30"
        >
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-violet-500 dark:text-violet-300"
            aria-hidden
          />
          <span className="text-sm font-medium text-sky-950 dark:text-sky-50">
            {tip}
          </span>
        </motion.li>
      ))}
    </ul>
  )
}

export default function StudentPsychResources() {
  const { session } = useAuth()
  const [openId, setOpenId] = useState<ResourceId | null>(null)
  const [sleepChecks, setSleepChecks] = useState<boolean[]>(() =>
    SLEEP_ITEMS.map(() => false),
  )
  const [stressTips, setStressTips] = useState(() =>
    readPsychStressTips().map((t) => t.text),
  )

  useEffect(() => {
    if (!session?.email) return
    setSleepChecks(loadSleepChecks(session.email))
  }, [session?.email])

  useEffect(() => {
    const sync = () =>
      setStressTips(readPsychStressTips().map((t) => t.text))
    sync()
    window.addEventListener(PSYCH_STRESS_TIPS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PSYCH_STRESS_TIPS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggleSleep = useCallback(
    (index: number) => {
      setSleepChecks((prev) => {
        const next = prev.map((v, i) => (i === index ? !v : v))
        if (session?.email) persistSleepChecks(session.email, next)
        return next
      })
    },
    [session?.email],
  )

  function toggleResource(id: ResourceId) {
    setOpenId((cur) => (cur === id ? null : id))
  }

  return (
    <section className="rounded-2xl border border-sky-400/35 bg-sky-500/10 p-4 dark:bg-sky-500/15">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-950 dark:text-sky-50">
        <ExternalLink className="size-4" aria-hidden />
        Нөөц боломжууд
      </div>
      <ul className="space-y-2">
        {RESOURCES.map((r) => {
          const open = openId === r.id
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => toggleResource(r.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-xl bg-white/75 px-3 py-2 text-sm font-medium text-sky-900 shadow-sm transition hover:bg-white dark:bg-black/35 dark:text-sky-50 dark:hover:bg-black/45"
              >
                {r.title}
                <ChevronDown
                  className={`size-4 shrink-0 opacity-60 transition-transform duration-300 ${
                    open ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      {r.id === 'grounding' && <GroundingPanel />}
                      {r.id === 'sleep' && (
                        <SleepChecklistPanel
                          checks={sleepChecks}
                          onToggle={toggleSleep}
                        />
                      )}
                      {r.id === 'stress' && (
                        <StressTipsPanel tips={stressTips} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
