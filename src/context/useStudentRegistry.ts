import { useContext } from 'react'
import { StudentRegistryContext } from './student-registry-context'

export function useStudentRegistry() {
  const ctx = useContext(StudentRegistryContext)
  if (!ctx) {
    throw new Error('useStudentRegistry must be used within StudentRegistryProvider')
  }
  return ctx
}
