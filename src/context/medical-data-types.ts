import type {
  ClinicalExamRecord,
  ClinicalExamState,
} from '../features/medical-exam/types'
import type {
  MedicalRecord,
  StudentHealthAlert,
  StudentHealthProfile,
  UpsertMedicalInput,
} from '../types'

export interface MedicalDataContextValue {
  records: MedicalRecord[]
  alerts: StudentHealthAlert[]
  profiles: Record<string, StudentHealthProfile>
  getProfileResolved: (
    studentId: string | null | undefined,
  ) => StudentHealthProfile | null
  upsertMedicalRecord: (
    payload: UpsertMedicalInput,
  ) => MedicalRecord
  deleteMedicalRecord: (id: string) => void
  addHealthAlert: (
    payload: Omit<StudentHealthAlert, 'id'>,
  ) => StudentHealthAlert
  deleteHealthAlert: (id: string) => void
  upsertHealthProfile: (
    studentId: string,
    patch: Partial<Omit<StudentHealthProfile, 'studentId'>>,
  ) => void
  listClinicalExams: (
    studentId: string | null | undefined,
  ) => ClinicalExamRecord[]
  getClinicalExamRecord: (
    studentId: string | null | undefined,
    examId: string,
  ) => ClinicalExamRecord | null
  createClinicalExam: (studentId: string, examDate: string) => string
  updateClinicalExamRecord: (
    studentId: string,
    examId: string,
    state: ClinicalExamState,
  ) => void
  updateClinicalExamDate: (
    studentId: string,
    examId: string,
    examDate: string,
  ) => void
}
