import { createContext } from 'react'
import type { MedicalDataContextValue } from './medical-data-types'

/** @internal */
export const MedicalDataContext =
  createContext<MedicalDataContextValue | null>(null)
