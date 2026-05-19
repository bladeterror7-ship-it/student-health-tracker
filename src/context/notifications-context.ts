import { createContext } from 'react'
import type { AppNotification, NotificationType } from '../types'

export type NotificationsContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  unreadCountByType: (type: NotificationType) => number
  push: (input: { text: string; type: NotificationType }) => AppNotification
  markRead: (id: string) => void
  markReadByType: (type: NotificationType) => void
  markAllRead: () => void
}

export const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined)
