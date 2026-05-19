import type { AppNotification, NotificationType } from '../types'
import { uid } from './uid'

const STORAGE_KEY = 'pe-student-notifications-v1'

export const NOTIFICATIONS_CHANGED_EVENT = 'pe-notifications-changed'

function dispatch() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT))
}

export function readNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppNotification[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((n) => n?.id && n.text && n.type && n.timestamp)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
  } catch {
    return []
  }
}

function persist(list: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  dispatch()
}

export function pushNotification(input: {
  text: string
  type: NotificationType
}): AppNotification {
  const row: AppNotification = {
    id: uid('ntf'),
    text: input.text.trim(),
    type: input.type,
    timestamp: new Date().toISOString(),
    isRead: false,
  }
  const next = [row, ...readNotifications()].slice(0, 80)
  persist(next)
  return row
}

export function markNotificationRead(id: string) {
  const next = readNotifications().map((n) =>
    n.id === id ? { ...n, isRead: true } : n,
  )
  persist(next)
}

export function markNotificationsReadByType(type: NotificationType) {
  const next = readNotifications().map((n) =>
    n.type === type ? { ...n, isRead: true } : n,
  )
  persist(next)
}

export function markAllNotificationsRead() {
  const next = readNotifications().map((n) => ({ ...n, isRead: true }))
  persist(next)
}

export function countUnread(
  list: readonly AppNotification[],
  type?: NotificationType,
): number {
  return list.filter(
    (n) => !n.isRead && (type == null || n.type === type),
  ).length
}
