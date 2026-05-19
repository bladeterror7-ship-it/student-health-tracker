import { useEffect, useState } from 'react'
import {
  PSYCH_GRATITUDE_LOGS_EVENT,
  readPsychGratitudeLogs,
} from '../lib/psychActivityStorage'
import type { PsychGratitudeLog } from '../types'

export function usePsychGratitudeLogs() {
  const [logs, setLogs] = useState<PsychGratitudeLog[]>(readPsychGratitudeLogs)

  useEffect(() => {
    function sync() {
      setLogs(readPsychGratitudeLogs())
    }
    window.addEventListener(PSYCH_GRATITUDE_LOGS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PSYCH_GRATITUDE_LOGS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return logs
}
