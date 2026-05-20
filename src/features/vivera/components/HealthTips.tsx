import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { HEALTH_TIPS } from '../constants'

export default function HealthTips() {
  return (
    <section
      className="rounded-2xl border border-vivera-secondary/20 bg-white p-4 shadow-sm"
      aria-labelledby="vivera-tips-heading"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-vivera-secondary/15 text-vivera-secondary">
          <BookOpen className="size-4" aria-hidden />
        </span>
        <div>
          <h4
            id="vivera-tips-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Ус яагаад чухал вэ?
          </h4>
          <p className="text-[11px] text-slate-500">Боловсролын булан</p>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {HEALTH_TIPS.map((tip, i) => (
          <motion.li
            key={tip.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-slate-100 bg-vivera-surface/80 p-3 text-left"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span aria-hidden>{tip.icon}</span>
              {tip.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {tip.body}
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
