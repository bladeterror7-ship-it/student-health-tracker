import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Brain, HeartPulse, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../context/useNotifications'
import type { AppNotification, NotificationType } from '../types'

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: typeof Video; accent: string }
> = {
  video: {
    label: 'Биеийн тамир',
    icon: Video,
    accent:
      'border-emerald-300/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-100',
  },
  medical: {
    label: 'Эмч',
    icon: HeartPulse,
    accent:
      'border-sky-300/50 bg-sky-500/10 text-sky-900 dark:border-sky-500/30 dark:text-sky-100',
  },
  psychology: {
    label: 'Сэтгэл зүй',
    icon: Brain,
    accent:
      'border-violet-300/50 bg-violet-500/10 text-violet-900 dark:border-violet-500/30 dark:text-violet-100',
  },
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('mn-MN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function NotificationRow({
  item,
  onSelect,
}: {
  item: AppNotification
  onSelect: (id: string) => void
}) {
  const meta = TYPE_META[item.type]
  const Icon = meta.icon
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`w-full rounded-xl border px-2.5 py-2 text-left transition hover:brightness-[1.02] ${meta.accent} ${
          item.isRead ? 'opacity-70' : 'ring-1 ring-violet-400/25'
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-black/30">
            <Icon className="size-3.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                {meta.label}
              </span>
              {!item.isRead && (
                <span className="size-2 shrink-0 rounded-full bg-rose-500 shadow-sm" />
              )}
            </span>
            <p className="mt-0.5 text-xs font-medium leading-snug">{item.text}</p>
            <p className="mt-1 text-[10px] opacity-60">{formatWhen(item.timestamp)}</p>
          </span>
        </div>
      </button>
    </li>
  )
}

export default function StudentNotificationBell() {
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
  } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function handleSelect(id: string) {
    markRead(id)
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        className="relative inline-flex size-11 items-center justify-center rounded-xl border border-violet-200/70 bg-white/75 text-violet-800 shadow-sm backdrop-blur-md transition hover:bg-violet-50 dark:border-violet-500/35 dark:bg-violet-950/45 dark:text-violet-100 dark:hover:bg-violet-900/55"
        aria-label="Мэдэгдэл"
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex min-w-[1.1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-950"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute right-0 top-full z-30 mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-2xl border border-violet-200/60 bg-white/90 shadow-2xl shadow-violet-900/15 backdrop-blur-2xl dark:border-violet-500/25 dark:bg-slate-950/92"
          >
            <div className="flex items-center justify-between gap-2 border-b border-violet-200/50 bg-gradient-to-r from-violet-500/12 via-emerald-500/8 to-fuchsia-500/10 px-3 py-2.5 dark:border-violet-500/20">
              <div className="text-left">
                <p className="text-xs font-semibold text-violet-950 dark:text-violet-100">
                  Мэдэгдэл
                </p>
                <p className="text-[10px] text-violet-800/70 dark:text-violet-200/55">
                  {unreadCount > 0
                    ? `${unreadCount} уншаагүй`
                    : 'Бүгд уншсан'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="shrink-0 rounded-lg border border-violet-300/40 bg-white/80 px-2 py-1 text-[10px] font-semibold text-violet-800 transition hover:bg-violet-50 dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-100"
                >
                  Бүгдийг унших
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <p className="px-2 py-8 text-center text-xs text-slate-500 dark:text-violet-200/45">
                  Одоогоор мэдэгдэл алга.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {notifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      item={n}
                      onSelect={handleSelect}
                    />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
