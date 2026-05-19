import type { Session } from '../types'

/** Дээд header-ийн мэндчилгээ. */
export function formatSessionGreeting(session: Session): string {
  if (
    session.role === 'student' &&
    session.lastName &&
    session.firstName &&
    session.classGroup
  ) {
    return `Сайн байна уу, ${session.lastName} ${session.firstName} (${session.classGroup} анги)`
  }
  return `Сайн байна уу, ${session.displayName}`
}
