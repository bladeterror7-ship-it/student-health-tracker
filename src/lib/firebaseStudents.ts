import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth, db } from '../firebaseConfig'
import { STUDENT_CLASS_OPTIONS, type RegisteredStudent } from '../types'

export type RegisterStudentFirebaseInput = {
  email: string
  password: string
  lastName: string
  firstName: string
  classGroup: string
}

export type FirebaseStudentProfile = {
  firstName: string
  lastName: string
  email: string
  classGroup: string
  role: 'student'
}

function isValidClass(c: string) {
  return (STUDENT_CLASS_OPTIONS as readonly string[]).includes(c)
}

export function firebaseAuthErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Энэ и-мэйлээр аль хэдийн бүртгэлтэй байна'
    case 'auth/invalid-email':
      return 'И-мэйл хаяг буруу байна'
    case 'auth/weak-password':
      return 'Нууц үг хэтэрхий богино байна (дор хаяж 6 тэмдэгт)'
    case 'auth/wrong-password':
      return 'Нууц үг буруу байна'
    case 'auth/user-not-found':
      return 'Бүртгэл олдсонгүй'
    case 'auth/invalid-credential':
      return 'И-мэйл эсвэл нууц үг буруу байна'
    case 'auth/too-many-requests':
      return 'Хэт олон оролдлого — түр хүлээгээд дахин оролдоно уу'
    default:
      return error instanceof Error
        ? error.message
        : 'Тодорхойгүй алдаа гарлаа'
  }
}

function docToRegisteredStudent(
  id: string,
  data: DocumentData,
): RegisteredStudent | null {
  const email = String(data.email ?? '').trim().toLowerCase()
  const lastName = String(data.lastName ?? '').trim()
  const firstName = String(data.firstName ?? '').trim()
  const classGroup = String(data.classGroup ?? '').trim()
  if (!email || !lastName || !firstName || !classGroup) return null

  const fullName =
    String(data.fullName ?? '').trim() || `${lastName} ${firstName}`.trim()

  const created = data.createdAt
  const registeredAt =
    created && typeof created === 'object' && 'toDate' in created
      ? (created as { toDate: () => Date }).toDate().toISOString()
      : typeof created === 'string'
        ? created
        : new Date().toISOString()

  return {
    id,
    fullName,
    lastName,
    firstName,
    email,
    classGroup,
    registeredAt,
    status: data.status === 'inactive' ? 'inactive' : 'active',
  }
}

export function subscribeStudents(
  onData: (students: RegisteredStudent[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'students'),
    (snapshot) => {
      const rows = snapshot.docs
        .map((d) => docToRegisteredStudent(d.id, d.data()))
        .filter((s): s is RegisteredStudent => s !== null)
        .sort(
          (a, b) =>
            new Date(b.registeredAt).getTime() -
            new Date(a.registeredAt).getTime(),
        )
      onData(rows)
    },
    (error) => onError?.(error),
  )
}

export async function registerStudentWithFirebase(
  input: RegisterStudentFirebaseInput,
): Promise<{ ok: true; uid: string } | { ok: false; reason: string }> {
  const email = input.email.trim().toLowerCase()
  const lastName = input.lastName.trim()
  const firstName = input.firstName.trim()
  const classGroup = input.classGroup.trim()
  const password = input.password

  if (!email || !lastName || !firstName || !classGroup || !password) {
    return { ok: false, reason: 'Бүх талбарыг бөглөнө үү' }
  }
  if (!isValidClass(classGroup)) {
    return { ok: false, reason: 'Анги буруу байна' }
  }

  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )
    const user = userCredential.user

    await setDoc(doc(db, 'students', user.uid), {
      firstName,
      lastName,
      fullName: `${lastName} ${firstName}`,
      email,
      classGroup,
      role: 'student',
      status: 'active',
      createdAt: serverTimestamp(),
    })

    return { ok: true, uid: user.uid }
  } catch (error) {
    console.error('Firebase бүртгэлийн алдаа:', error)
    return { ok: false, reason: firebaseAuthErrorMessage(error) }
  }
}

export async function signInStudentWithFirebase(
  email: string,
  password: string,
): Promise<
  | {
      ok: true
      profile: RegisteredStudent
      credential: UserCredential
    }
  | { ok: false; reason: string }
> {
  const id = email.trim().toLowerCase()
  if (!id || !password) {
    return { ok: false, reason: 'И-мэйл болон нууц үгээ оруулна уу' }
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, id, password)
    const snap = await getDoc(doc(db, 'students', credential.user.uid))
    if (!snap.exists()) {
      return { ok: false, reason: 'Сурагчийн профайл олдсонгүй' }
    }
    const student = docToRegisteredStudent(snap.id, snap.data())
    if (!student || student.status !== 'active') {
      return { ok: false, reason: 'Бүртгэл идэвхгүй эсвэл олдсонгүй' }
    }
    return { ok: true, profile: student, credential }
  } catch (error) {
    console.error('Firebase нэвтрэх алдаа:', error)
    return { ok: false, reason: firebaseAuthErrorMessage(error) }
  }
}

export async function updateStudentInFirebase(
  id: string,
  patch: Partial<
    Pick<RegisteredStudent, 'fullName' | 'classGroup' | 'email' | 'status'>
  >,
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (patch.fullName !== undefined) {
    const fullName = patch.fullName.trim()
    payload.fullName = fullName
    const parts = fullName.split(/\s+/)
    if (parts[0]) payload.lastName = parts[0]
    if (parts.length > 1) payload.firstName = parts.slice(1).join(' ')
  }
  if (patch.email !== undefined) payload.email = patch.email.trim().toLowerCase()
  if (patch.classGroup !== undefined) payload.classGroup = patch.classGroup.trim()
  if (patch.status !== undefined) payload.status = patch.status
  if (Object.keys(payload).length === 0) return
  await updateDoc(doc(db, 'students', id), payload)
}

export async function deleteStudentFromFirebase(id: string): Promise<void> {
  await deleteDoc(doc(db, 'students', id))
}
