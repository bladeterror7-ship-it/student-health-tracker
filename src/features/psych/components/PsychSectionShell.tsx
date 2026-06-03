import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function PsychSectionShell({
  icon: Icon,
  title,
  subtitle,
  children,
  className = '',
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500/[0.1] via-white/55 to-fuchsia-500/[0.08] p-4 shadow-sm backdrop-blur-xl dark:border-violet-400/25 dark:from-violet-500/12 dark:via-white/[0.04] dark:to-fuchsia-500/10 sm:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/15 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-200">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 text-left">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-violet-100/65">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function PsychChoiceButton({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm leading-relaxed transition ${
        active
          ? 'border-violet-500/60 bg-white/95 shadow-md ring-2 ring-violet-500/30 dark:border-violet-400/50 dark:bg-white/10 dark:ring-violet-400/25'
          : 'border-white/55 bg-white/60 hover:border-violet-400/35 hover:bg-white/80 dark:border-white/10 dark:bg-black/25 dark:hover:border-violet-400/30 dark:hover:bg-black/35'
      }`}
    >
      {children}
    </motion.button>
  )
}
