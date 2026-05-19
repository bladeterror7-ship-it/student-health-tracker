import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MedicalDataContext } from './medical-context'
import type { MedicalDataContextValue } from './medical-data-types'
import type {
  MedicalRecord,
  StudentHealthAlert,
  StudentHealthProfile,
  UpsertMedicalInput,
} from '../types'
import {
  bumpLastCheckup,
  loadMedicalBundle,
  MEDICAL_STORAGE_KEYS,
  newHealthAlert,
  newMedicalRow,
  persistMedicalBundle,
  resolvedProfileFallback,
  type MedicalBundle,
} from '../lib/medicalStorage'

export function MedicalDataProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<MedicalBundle>(() => loadMedicalBundle())

  const commit = useCallback((next: MedicalBundle) => {
    persistMedicalBundle(next)
    setBundle(next)
  }, [])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (
        e.key &&
        (MEDICAL_STORAGE_KEYS as readonly string[]).includes(e.key)
      ) {
        setBundle(loadMedicalBundle())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const getProfileResolved = useCallback(
    (studentId: string | null | undefined) => {
      if (!studentId) return null
      return resolvedProfileFallback(studentId, bundle.profiles, bundle.records)
    },
    [bundle.profiles, bundle.records],
  )

  const upsertMedicalRecord = useCallback(
    (payload: UpsertMedicalInput) => {
      const trimmedName = payload.studentName.trim()
      const trimmedType = payload.recordType.trim()
      const trimmedSummary = payload.summary?.trim() ?? ''
      const trimmedStatus = payload.status.trim()
      const alertTrimmed = payload.alert?.trim()

      const idExists =
        !!payload.id && bundle.records.some((r) => r.id === payload.id)

      const row: MedicalRecord =
        idExists && payload.id
          ? {
              id: payload.id,
              studentId: payload.studentId,
              studentName: trimmedName,
              recordType: trimmedType,
              date: payload.date,
              status: trimmedStatus,
              summary: trimmedSummary,
              alert: alertTrimmed || undefined,
            }
          : newMedicalRow({
              studentId: payload.studentId,
              studentName: trimmedName,
              recordType: trimmedType,
              date: payload.date,
              status: trimmedStatus,
              summary: trimmedSummary,
              alert: alertTrimmed || undefined,
            })

      const nextRecords = idExists
        ? bundle.records.map((r) => (r.id === row.id ? row : r))
        : [row, ...bundle.records]

      const nextProfiles = bumpLastCheckup(
        bundle.profiles,
        row.studentId,
        row.date,
      )

      commit({
        records: nextRecords,
        alerts: bundle.alerts,
        profiles: nextProfiles,
      })

      return row
    },
    [bundle.alerts, bundle.records, bundle.profiles, commit],
  )

  const deleteMedicalRecord = useCallback(
    (id: string) => {
      const nextRecords = bundle.records.filter((r) => r.id !== id)
      commit({
        records: nextRecords,
        alerts: bundle.alerts,
        profiles: bundle.profiles,
      })
    },
    [bundle.alerts, bundle.records, bundle.profiles, commit],
  )

  const addHealthAlert = useCallback(
    (payload: Omit<StudentHealthAlert, 'id'>) => {
      const row = newHealthAlert({
        studentId: payload.studentId,
        level: payload.level,
        text: payload.text.trim(),
      })
      commit({
        records: bundle.records,
        alerts: [row, ...bundle.alerts],
        profiles: bundle.profiles,
      })
      return row
    },
    [bundle.alerts, bundle.records, bundle.profiles, commit],
  )

  const deleteHealthAlert = useCallback(
    (id: string) => {
      commit({
        records: bundle.records,
        alerts: bundle.alerts.filter((a) => a.id !== id),
        profiles: bundle.profiles,
      })
    },
    [bundle.alerts, bundle.records, bundle.profiles, commit],
  )

  const upsertHealthProfile = useCallback(
    (
      studentId: string,
      patch: Partial<Omit<StudentHealthProfile, 'studentId'>>,
    ) => {
      if (!studentId) return
      const fb = resolvedProfileFallback(
        studentId,
        bundle.profiles,
        bundle.records,
      )
      const base = bundle.profiles[studentId] ?? fb
      commit({
        records: bundle.records,
        alerts: bundle.alerts,
        profiles: {
          ...bundle.profiles,
          [studentId]: {
            ...base,
            ...patch,
            studentId,
            vitals: {
              ...base.vitals,
              ...patch.vitals,
            },
          },
        },
      })
    },
    [bundle.alerts, bundle.profiles, bundle.records, commit],
  )

  const value = useMemo<MedicalDataContextValue>(
    () => ({
      records: bundle.records,
      alerts: bundle.alerts,
      profiles: bundle.profiles,
      getProfileResolved,
      upsertMedicalRecord,
      deleteMedicalRecord,
      addHealthAlert,
      deleteHealthAlert,
      upsertHealthProfile,
    }),
    [
      bundle.records,
      bundle.alerts,
      bundle.profiles,
      getProfileResolved,
      upsertMedicalRecord,
      deleteMedicalRecord,
      addHealthAlert,
      deleteHealthAlert,
      upsertHealthProfile,
    ],
  )

  return (
    <MedicalDataContext.Provider value={value}>
      {children}
    </MedicalDataContext.Provider>
  )
}
