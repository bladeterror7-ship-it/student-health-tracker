import { createContext } from 'react'
import type { RegisteredStudent } from '../types'

export type AuthenticatedStudent = {
  student: RegisteredStudent
  lastName: string
  firstName: string
}

export interface RegisterStudentInput {
  email: string
  password: string
  lastName: string
  firstName: string
  classGroup: string
}

export interface StudentRegistryContextValue {
  students: RegisteredStudent[]
  loading: boolean
  registerStudent: (input: RegisterStudentInput) => { ok: true } | { ok: false; reason: string }
  authenticateStudent: (
    identifier: string,
    password: string,
  ) =>
    | { ok: true; data: AuthenticatedStudent }
    | { ok: false; reason: string }
  updateStudent: (
    id: string,
    patch: Partial<
      Pick<RegisteredStudent, 'fullName' | 'classGroup' | 'email' | 'status'>
    >,
  ) => void
  deleteStudent: (id: string) => void
  resetStudentPassword: (id: string, newPassword: string) => Promise<void>
}

export const StudentRegistryContext =
  createContext<StudentRegistryContextValue | null>(null)
