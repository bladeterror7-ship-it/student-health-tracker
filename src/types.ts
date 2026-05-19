export type UserRole = 'student' | 'admin' | 'parent'

export interface Session {
  role: UserRole
  email: string
  displayName: string
  /** Сурагчийн овог (бүртгэлээс). */
  lastName?: string
  /** Сурагчийн нэр (бүртгэлээс). */
  firstName?: string
  /** Сурагчийн анги (бүртгэлээс). */
  classGroup?: string
  /** Эцэг эх: холбогдсон сурагчийн ID. */
  linkedStudentId?: string
  /** Эцэг эх: холбогдсон сурагчийн нэр. */
  linkedStudentName?: string
}

/** Эмчийн системд орсон үзлэгийн мөр — сурагчийн UUID-ээр холбогдоно. */
export interface MedicalRecord {
  id: string
  studentId: string
  studentName: string
  /** Үзлэгийн төрөл (Жилийн үзлэг, Шүдний үзлэг …) */
  recordType: string
  date: string
  status: string
  summary: string
  alert?: string
}

export type UpsertMedicalInput = Omit<MedicalRecord, 'id'> & { id?: string }

export type StudentHealthAlertLevel = 'warning' | 'info'

/** Сурагчийн эрүүл мэндийн анхааруулгын картууд. */
export interface StudentHealthAlert {
  id: string
  studentId: string
  level: StudentHealthAlertLevel
  text: string
}

/** Эмийн самбарт харагдах ерөнхий төлөв + үзүүлэлтүүд. */
export interface StudentHealthProfile {
  studentId: string
  overallStatus: string
  lastCheckup: string
  vitals: {
    pulse: string
    pressure: string
    vision: string
  }
}

export interface PsychRecord {
  id: string
  studentName: string
  date: string
  moodScore: number
  notes: string
}

export interface PERecord {
  id: string
  studentName: string
  date: string
  activity: string
  score: number
}

export const STUDENT_CLASS_OPTIONS = [
  '6-1',
  '7-1',
  '7-2',
  '8-1',
  '9-1',
  '10-1',
  '10-2',
  '11-1',
  '11-2',
  '12-1',
  '12-2',
] as const

export type StudentClassOption = (typeof STUDENT_CLASS_OPTIONS)[number]

export type RegisteredStudentStatus = 'active' | 'inactive'

export interface RegisteredStudent {
  id: string
  fullName: string
  lastName?: string
  firstName?: string
  classGroup: string
  email: string
  registeredAt: string
  status: RegisteredStudentStatus
}

export type DoctorQuestionStatus = 'new' | 'answered'

/** Student → school doctor confidential message (demo: localStorage). */
export interface DoctorQuestion {
  id: string
  studentEmail: string
  studentDisplayName: string
  anonymous: boolean
  classGroup: string
  body: string
  createdAt: string
  status: DoctorQuestionStatus
  reply?: string
  repliedAt?: string
}

/** Сурагчийн өдрийн эмодиг сонголт (демо: localStorage). */
export interface PsychMoodLog {
  id: string
  studentName: string
  studentEmail: string
  moodId: string
  moodEmoji: string
  moodLabelMn: string
  moodScore: number
  createdAt: string
  /** Сэтгэлийг нууцлаж бүртгэсэн эсэх (демо). */
  isAnonymous?: boolean
}

/** Сурагчийн талархлын 3 талбар (демо: localStorage). */
export interface PsychGratitudeLog {
  id: string
  studentName: string
  studentEmail: string
  field1: string
  field2: string
  field3: string
  combinedNote: string
  dayLabel: string
  createdAt: string
}

/** Сэтгэл зүйчийн цагийн захиалга (демо: localStorage). */
export interface PsychSessionBooking {
  id: string
  date: string
  timeSlot: string
  isAnonymous: boolean
  /** Харагдах нэр — нууцлагдсан бол «Ананим Сурагч». */
  studentName: string
  studentEmail?: string
  createdAt: string
  readByPsych?: boolean
}

export type NotificationType = 'video' | 'medical' | 'psychology'

/** Сурагчид зориулсан админы мэдэгдэл (localStorage + context). */
export interface AppNotification {
  id: string
  text: string
  type: NotificationType
  timestamp: string
  isRead: boolean
}

/** Багшийн дамжуулсан дамжааны зааварын бичлэг (демо). */
export interface PeTutorialPublish {
  id: string
  title: string
  description: string
  classGroup: string
  storageKey: string
  fileName: string
  createdAt: string
}
