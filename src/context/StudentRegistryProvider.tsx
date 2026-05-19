import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  deleteStudentFromFirebase,
  subscribeStudents,
  updateStudentInFirebase,
} from '../lib/firebaseStudents'
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

  useEffect(() => {
    const unsub = subscribeStudents(
      (rows) => {
        setStudents(rows)
        setLoading(false)
      },
      (error) => {
        console.error('Firestore students sync:', error)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  /** Firebase бүртгэл LoginPage дээр шууд хийгдэнэ — энд зөвхөн validation. */
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
        reason:
          'Сурагчийн нэвтрэлт Firebase-ээр хийгдэнэ — и-мэйлээ ашиглана уу',
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

      void updateStudentInFirebase(id, patch).catch((error) => {
        console.error('Firestore update student:', error)
      })
    },
    [],
  )

  const deleteStudent = useCallback((id: string) => {
    void deleteStudentFromFirebase(id).catch((error) => {
      console.error('Firestore delete student:', error)
    })
  }, [])

  const value = useMemo(
    () => ({
      students,
      loading,
      registerStudent,
      authenticateStudent,
      updateStudent,
      deleteStudent,
    }),
    [
      students,
      loading,
      registerStudent,
      authenticateStudent,
      updateStudent,
      deleteStudent,
    ],
  )

  return (
    <StudentRegistryContext.Provider value={value}>
      {children}
    </StudentRegistryContext.Provider>
  )
}
