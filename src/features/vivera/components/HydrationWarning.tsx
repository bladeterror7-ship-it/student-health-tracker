import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

type Props = {
  open: boolean
  onDismiss: () => void
}

export default function HydrationWarning({ open, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-vivera-accent/40 bg-vivera-accent/10 px-4 py-3 text-left shadow-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-vivera-accent"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Нэг дор хэт их уухгүй байх
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Ус их хэмжээг нэг дор уух нь заримдаа таагүй мэдрэмж өгч болно.
              250–500 мл-ээр тогтмол, жижиг хэмжээгээр уух нь илүү аюулгүй.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-black/5"
            aria-label="Хаах"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
