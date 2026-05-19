import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  deleteStudentFromNeon,
  fetchStudentsFromApi,
  resetStudentPasswordInNeon,
  STUDENT_REGISTRY_EVENT,
  updateStudentInNeon,
} from '../lib/neonStudents'
import { STUDENT_CLASS_OPTIONS, type RegisteredStudent } from '../types'
import {
  StudentRegistryContext,
  type RegisterStudentInput,
} from './student-registry-context'

function isValidClass(c: string) {
  return (STUDENT_CLASS_OPTIONS as readonly string[]).includes(c)
}

export function StudentRegistryProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<RegisteredStudent[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const rows = await fetchStudentsFromApi()
      setStudents(rows)
    } catch (error) {
      console.error('Neon students sync:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    const onChange = () => void reload()
    window.addEventListener(STUDENT_REGISTRY_EVENT, onChange)
    const interval = window.setInterval(() => void reload(), 60_000)
    return () => {
      window.removeEventListener(STUDENT_REGISTRY_EVENT, onChange)
      window.clearInterval(interval)
    }
  }, [reload])

  const registerStudent = useCallback((input: RegisterStudentInput) => {
    const email = input.email.trim().toLowerCase()
    const classGroup = input.classGroup.trim()
    if (
      !email ||
      !input.lastName.trim() ||
      !input.firstName.trim() ||
      !classGroup ||
      !input.password
    ) {
      return { ok: false as const, reason: 'Бүх талбарыг бөглөнө үү' }
    }
    if (!isValidClass(classGroup)) {
      return { ok: false as const, reason: 'Анги буруу байна' }
    }
    if (students.some((s) => s.email.toLowerCase() === email)) {
      return {
        ok: false as const,
        reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна',
      }
    }
    return { ok: true as const }
  }, [students])

  const authenticateStudent = useCallback(
    (_identifier: string, _password: string) => {
      return {
        ok: false as const,
        reason: 'Сурагчийн нэвтрэлт серверээр (Neon DB) хийгдэнэ',
      }
    },
    [],
  )

  const updateStudent = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<RegisteredStudent, 'fullName' | 'classGroup' | 'email' | 'status'>
      >,
    ) => {
      const classGroup =
        patch.classGroup !== undefined ? patch.classGroup.trim() : undefined
      if (classGroup !== undefined && !isValidClass(classGroup)) return

      void updateStudentInNeon(id, patch).catch((error) => {
        console.error('Neon update student:', error)
      })
    },
    [],
  )

  const deleteStudent = useCallback((id: string) => {
    void deleteStudentFromNeon(id).catch((error) => {
      console.error('Neon delete student:', error)
    })
  }, [])

  const resetStudentPassword = useCallback(
    async (id: string, newPassword: string) => {
      await resetStudentPasswordInNeon(id, newPassword)
    },
    [],
  )

  const value = useMemo(
    () => ({
      students,
      loading,
      registerStudent,
      authenticateStudent,
      updateStudent,
      deleteStudent,
      resetStudentPassword,
    }),
    [
      students,
      loading,
      registerStudent,
      authenticateStudent,
      updateStudent,
      deleteStudent,
      resetStudentPassword,
    ],
  )

  return (
    <StudentRegistryContext.Provider value={value}>
      {children}
    </StudentRegistryContext.Provider>
  )
}
