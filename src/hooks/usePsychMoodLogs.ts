import { useEffect, useState } from 'react'
import {
  PSYCH_MOOD_LOGS_EVENT,
  readPsychMoodLogs,
} from '../lib/psychActivityStorage'
import type { PsychMoodLog } from '../types'

export function usePsychMoodLogs() {
  const [logs, setLogs] = useState<PsychMoodLog[]>(readPsychMoodLogs)

  useEffect(() => {
    function sync() {
      setLogs(readPsychMoodLogs())
    }
    window.addEventListener(PSYCH_MOOD_LOGS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PSYCH_MOOD_LOGS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return logs
}
