import { useEffect, useMemo, useState } from 'react'
import {
  PSYCH_BOOKINGS_EVENT,
  readPsychBookings,
} from '../lib/psychBookingsStorage'
import type { PsychSessionBooking } from '../types'

export function usePsychBookings() {
  const [bookings, setBookings] = useState<PsychSessionBooking[]>(
    readPsychBookings,
  )

  useEffect(() => {
    function sync() {
      setBookings(readPsychBookings())
    }
    window.addEventListener(PSYCH_BOOKINGS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PSYCH_BOOKINGS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const unreadCount = useMemo(
    () => bookings.filter((b) => !(b.readByPsych ?? false)).length,
    [bookings],
  )

  return { bookings, unreadCount }
}
