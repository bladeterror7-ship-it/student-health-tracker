import { useCallback, useEffect, useState } from 'react'
import {
  DOCTOR_QUESTIONS_EVENT,
  fetchDoctorQuestions,
} from '../lib/neonDoctorQuestions'
import type { DoctorQuestion } from '../types'

export function useDoctorQuestions() {
  const [questions, setQuestions] = useState<DoctorQuestion[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const rows = await fetchDoctorQuestions()
      setQuestions(rows)
    } catch (error) {
      console.error('Doctor questions sync:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    const onChange = () => void reload()
    window.addEventListener(DOCTOR_QUESTIONS_EVENT, onChange)
    const interval = window.setInterval(() => void reload(), 12_000)
    return () => {
      window.removeEventListener(DOCTOR_QUESTIONS_EVENT, onChange)
      window.clearInterval(interval)
    }
  }, [reload])

  return { questions, loading, reload }
}
