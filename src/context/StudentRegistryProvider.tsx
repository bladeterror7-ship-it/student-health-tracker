import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  setStudentPassword,
  verifyStudentPassword,
} from '../lib/studentPasswordStorage'
import { uid } from '../lib/uid'
import { STUDENT_CLASS_OPTIONS, type RegisteredStudent } from '../types'
import {
  StudentRegistryContext,
  type RegisterStudentInput,
} from './student-registry-context'

const STORAGE_KEY = 'pe-registry-v1'

const LEGACY_SEED_IDS = new Set(['seed_demo', 'seed_1', 'seed_2'])
const LEGACY_SEED_EMAILS = new Set([
  'demo@school.edu.mn',
  'dorj@school.edu.mn',
  'enkhb@school.edu.mn',
])

function stripLegacySeeds(list: RegisteredStudent[]): RegisteredStudent[] {
  return list.filter(
    (s) =>
      !LEGACY_SEED_IDS.has(s.id) &&
      !LEGACY_SEED_EMAILS.has(s.email.toLowerCase()),
  )
}

function loadInitial(): RegisteredStudent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as RegisteredStudent[]
      if (Array.isArray(parsed)) {
        const cleaned = stripLegacySeeds(parsed)
        if (cleaned.length !== parsed.length) persist(cleaned)
        return cleaned
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

function persist(list: RegisteredStudent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function isValidClass(c: string) {
  return (STUDENT_CLASS_OPTIONS as readonly string[]).includes(c)
}

export function StudentRegistryProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<RegisteredStudent[]>(loadInitial)

  const registerStudent = useCallback((input: RegisterStudentInput) => {
    const email = input.email.trim().toLowerCase()
    const lastName = input.lastName.trim()
    const firstName = input.firstName.trim()
    const classGroup = input.classGroup.trim()
    const password = input.password

    if (!email || !lastName || !firstName || !classGroup || !password) {
      return { ok: false as const, reason: 'Бүх талбарыг бөглөнө үү' }
    }
    if (!isValidClass(classGroup)) {
      return { ok: false as const, reason: 'Анги буруу байна' }
    }

    let duplicate = false
    setStudents((prev) => {
      if (prev.some((s) => s.email.toLowerCase() === email)) {
        duplicate = true
        return prev
      }
      const fullName = `${lastName} ${firstName}`
      const row: RegisteredStudent = {
        id: uid('stu'),
        fullName,
        lastName,
        firstName,
        classGroup,
        email,
        registeredAt: new Date().toISOString(),
        status: 'active',
      }
      const next = [row, ...prev]
      persist(next)
      setStudentPassword(email, password)
      return next
    })

    if (duplicate) {
      return { ok: false as const, reason: 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна' }
    }
    return { ok: true as const }
  }, [])

  const authenticateStudent = useCallback(
    (identifier: string, password: string) => {
      const id = identifier.trim().toLowerCase()
      if (!id || !password) {
        return { ok: false as const, reason: 'И-мэйл/нэр болон нууц үгээ оруулна уу' }
      }

      const match = students.find((s) => {
        if (s.status !== 'active') return false
        const emailMatch = s.email.toLowerCase() === id
        const nameMatch = s.fullName.toLowerCase().includes(id)
        const compactName = s.fullName.toLowerCase().replace(/\s+/g, '')
        const compactId = id.replace(/\s+/g, '')
        return emailMatch || nameMatch || compactName.includes(compactId)
      })

      if (!match) {
        return { ok: false as const, reason: 'Бүртгэл олдсонгүй' }
      }

      if (!verifyStudentPassword(match.email, password)) {
        return { ok: false as const, reason: 'Нууц үг буруу байна' }
      }

      const parts = match.fullName.trim().split(/\s+/)
      const lastName = match.lastName ?? parts[0] ?? match.fullName
      const firstName =
        match.firstName ?? (parts.slice(1).join(' ') || lastName)

      return {
        ok: true as const,
        data: {
          student: match,
          lastName,
          firstName,
        },
      }
    },
    [students],
  )

  const updateStudent = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<RegisteredStudent, 'fullName' | 'classGroup' | 'email' | 'status'>
      >,
    ) => {
      setStudents((prev) => {
        const next = prev.map((s) => {
          if (s.id !== id) return s
          const classGroup =
            patch.classGroup !== undefined ? patch.classGroup.trim() : s.classGroup
          if (!isValidClass(classGroup)) return s
          return {
            ...s,
            ...patch,
            fullName:
              patch.fullName !== undefined ? patch.fullName.trim() : s.fullName,
            email:
              patch.email !== undefined
                ? patch.email.trim().toLowerCase()
                : s.email,
            classGroup,
          }
        })
        persist(next)
        return next
      })
    },
    [],
  )

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persist(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      students,
      registerStudent,
      authenticateStudent,
      updateStudent,
      deleteStudent,
    }),
    [students, registerStudent, authenticateStudent, updateStudent, deleteStudent],
  )

  return (
    <StudentRegistryContext.Provider value={value}>
      {children}
    </StudentRegistryContext.Provider>
  )
}
