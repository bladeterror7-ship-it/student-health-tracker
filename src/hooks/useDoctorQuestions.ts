import { useEffect, useState } from 'react'
import {
  DOCTOR_QUESTIONS_EVENT,
  readDoctorQuestions,
} from '../lib/doctorQuestionsStorage'

export function useDoctorQuestions() {
  const [questions, setQuestions] = useState(readDoctorQuestions)

  useEffect(() => {
    function sync() {
      setQuestions(readDoctorQuestions())
    }
    window.addEventListener(DOCTOR_QUESTIONS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(DOCTOR_QUESTIONS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return questions
}
