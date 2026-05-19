import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import {
  countUnread,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsReadByType,
  NOTIFICATIONS_CHANGED_EVENT,
  pushNotification,
  readNotifications,
} from '../lib/notificationsStorage'
import type { AppNotification, NotificationType } from '../types'
import { NotificationsContext } from './notifications-context'
import { useAuth } from './useAuth'

const TYPE_LABEL: Record<NotificationType, string> = {
  video: 'Биеийн тамир',
  medical: 'Эмч',
  psychology: 'Сэтгэл зүй',
}

function toastForNotification(n: AppNotification) {
  toast.custom(
    () => (
      <div className="pointer-events-auto flex w-[min(100vw-2rem,22rem)] items-start gap-3 rounded-2xl border border-violet-300/45 bg-white/95 p-3 shadow-xl shadow-violet-900/10 backdrop-blur-xl dark:border-violet-500/30 dark:bg-slate-950/95">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-emerald-500/20 text-lg">
          {n.type === 'video' ? '🎬' : n.type === 'medical' ? '🩺' : '🧠'}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            {TYPE_LABEL[n.type]}
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">
            {n.text}
          </p>
        </div>
      </div>
    ),
    { duration: 4500 },
  )
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readNotifications(),
  )
  const toastBootstrapped = useRef(false)
  const lastToastedId = useRef<string | null>(null)

  const sync = useCallback(() => {
    setNotifications(readNotifications())
  }, [])

  useEffect(() => {
    sync()
    const onChange = () => sync()
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [sync])

  useEffect(() => {
    if (session?.role !== 'student') return

    if (!toastBootstrapped.current) {
      toastBootstrapped.current = true
      const newest = notifications[0]
      if (newest) lastToastedId.current = newest.id
      return
    }

    const newestUnread = notifications.find((n) => !n.isRead)
    if (
      newestUnread &&
      newestUnread.id !== lastToastedId.current &&
      Date.now() - new Date(newestUnread.timestamp).getTime() < 120_000
    ) {
      lastToastedId.current = newestUnread.id
      toastForNotification(newestUnread)
    }
  }, [notifications, session?.role])

  const push = useCallback(
    (input: { text: string; type: NotificationType }) => {
      const row = pushNotification(input)
      sync()
      return row
    },
    [sync],
  )

  const markRead = useCallback(
    (id: string) => {
      markNotificationRead(id)
      sync()
    },
    [sync],
  )

  const markReadByType = useCallback(
    (type: NotificationType) => {
      markNotificationsReadByType(type)
      sync()
    },
    [sync],
  )

  const markAllRead = useCallback(() => {
    markAllNotificationsRead()
    sync()
  }, [sync])

  const unreadCount = useMemo(
    () => countUnread(notifications),
    [notifications],
  )

  const unreadCountByType = useCallback(
    (type: NotificationType) => countUnread(notifications, type),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      unreadCountByType,
      push,
      markRead,
      markReadByType,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      unreadCountByType,
      push,
      markRead,
      markReadByType,
      markAllRead,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}
