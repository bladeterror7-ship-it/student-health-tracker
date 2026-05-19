import { useContext } from 'react'
import { MedicalDataContext } from '../context/medical-context'
import type { MedicalDataContextValue } from '../context/medical-data-types'

export function useMedicalData(): MedicalDataContextValue {
  const ctx = useContext(MedicalDataContext)
  if (!ctx) {
    throw new Error('useMedicalData must be used within MedicalDataProvider')
  }
  return ctx
}
