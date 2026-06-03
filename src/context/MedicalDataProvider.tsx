import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MedicalDataContext } from './medical-context'
import type { MedicalDataContextValue } from './medical-data-types'
import {
  latestClinicalExamRecord,
  sortClinicalExamRecords,
  stateToClinicalRecord,
  todayYmd,
} from '../features/medical-exam/clinicalExamRecords'
import {
  DEFAULT_CLINICAL_EXAM,
  type ClinicalExamRecord,
  type ClinicalExamState,
} from '../features/medical-exam/types'
import {
  createClinicalExamInNeon,
  fetchClinicalExamsFromNeon,
  isNeonClinicalExamId,
  migrateLocalClinicalExamsToNeon,
  replaceExamInStudentList,
  updateClinicalExamInNeon,
} from '../lib/neonClinicalExams'
import type {
  MedicalRecord,
  StudentHealthAlert,
  StudentHealthProfile,
  UpsertMedicalInput,
} from '../types'
import {
  bumpLastCheckup,
  loadMedicalBundle,
  MEDICAL_CHANGED_EVENT,
  MEDICAL_STORAGE_KEYS,
  newHealthAlert,
  newMedicalRow,
  persistMedicalBundle,
  resolvedProfileFallback,
  type MedicalBundle,
} from '../lib/medicalStorage'

const PATCH_DEBOUNCE_MS = 650

export function MedicalDataProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<MedicalBundle>(() => loadMedicalBundle())
  const patchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  const bundleRef = useRef(bundle)
  bundleRef.current = bundle

  const commit = useCallback((next: MedicalBundle) => {
    persistMedicalBundle(next)
    setBundle(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const remote = await fetchClinicalExamsFromNeon()
        if (cancelled) return
        const local = loadMedicalBundle().clinicalExams
        const merged = await migrateLocalClinicalExamsToNeon(local, remote)
        if (cancelled) return
        setBundle((prev) => {
          const next = {
            ...prev,
            clinicalExams: merged,
            profiles: prev.profiles,
          }
          persistMedicalBundle(next)
          return next
        })
      } catch (error) {
        console.warn('[clinical-exams] Neon sync:', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function reload() {
      setBundle(loadMedicalBundle())
    }
    function onStorage(e: StorageEvent) {
      if (
        e.key &&
        (MEDICAL_STORAGE_KEYS as readonly string[]).includes(e.key)
      ) {
        reload()
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(MEDICAL_CHANGED_EVENT, reload)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(MEDICAL_CHANGED_EVENT, reload)
      for (const t of patchTimers.current.values()) clearTimeout(t)
      patchTimers.current.clear()
    }
  }, [])

  const scheduleNeonPatch = useCallback(
    (examId: string, studentId: string, state: ClinicalExamState) => {
      if (!isNeonClinicalExamId(examId)) return
      const prev = patchTimers.current.get(examId)
      if (prev) clearTimeout(prev)
      patchTimers.current.set(
        examId,
        setTimeout(() => {
          patchTimers.current.delete(examId)
          void updateClinicalExamInNeon({ id: examId, state })
            .then((dto) => {
              setBundle((b) => {
                const list = b.clinicalExams[studentId] ?? []
                const nextList = sortClinicalExamRecords(
                  list.map((r) =>
                    r.id === examId
                      ? {
                          ...r,
                          savedAt: dto.savedAt,
                          state: dto.state,
                        }
                      : r,
                  ),
                )
                const next = {
                  ...b,
                  clinicalExams: {
                    ...b.clinicalExams,
                    [studentId]: nextList,
                  },
                }
                persistMedicalBundle(next)
                return next
              })
            })
            .catch((err) => console.warn('[clinical-exams] patch:', err))
        }, PATCH_DEBOUNCE_MS),
      )
    },
    [],
  )

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
        ...bundle,
        records: nextRecords,
        profiles: nextProfiles,
      })

      return row
    },
    [bundle, commit],
  )

  const deleteMedicalRecord = useCallback(
    (id: string) => {
      const nextRecords = bundle.records.filter((r) => r.id !== id)
      commit({ ...bundle, records: nextRecords })
    },
    [bundle, commit],
  )

  const addHealthAlert = useCallback(
    (payload: Omit<StudentHealthAlert, 'id'>) => {
      const row = newHealthAlert({
        studentId: payload.studentId,
        level: payload.level,
        text: payload.text.trim(),
      })
      commit({ ...bundle, alerts: [row, ...bundle.alerts] })
      return row
    },
    [bundle, commit],
  )

  const deleteHealthAlert = useCallback(
    (id: string) => {
      commit({
        ...bundle,
        alerts: bundle.alerts.filter((a) => a.id !== id),
      })
    },
    [bundle, commit],
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
        ...bundle,
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
    [bundle, commit],
  )

  const applyLatestVision = useCallback(
    (
      studentId: string,
      records: ClinicalExamRecord[],
      profiles: MedicalBundle['profiles'],
    ) => {
      const latest = latestClinicalExamRecord(records)
      if (!latest) return profiles
      const fb = resolvedProfileFallback(
        studentId,
        profiles,
        bundleRef.current.records,
      )
      const base = profiles[studentId] ?? fb
      return {
        ...profiles,
        [studentId]: {
          ...base,
          lastCheckup:
            latest.examDate.localeCompare(base.lastCheckup) > 0
              ? latest.examDate
              : base.lastCheckup,
        },
      }
    },
    [],
  )

  const listClinicalExams = useCallback(
    (studentId: string | null | undefined) => {
      if (!studentId) return []
      return sortClinicalExamRecords(bundle.clinicalExams[studentId] ?? [])
    },
    [bundle.clinicalExams],
  )

  const getClinicalExamRecord = useCallback(
    (studentId: string | null | undefined, examId: string) => {
      if (!studentId || !examId) return null
      return (
        (bundle.clinicalExams[studentId] ?? []).find((r) => r.id === examId) ??
        null
      )
    },
    [bundle.clinicalExams],
  )

  const createClinicalExam = useCallback(
    (studentId: string, examDate: string) => {
      const date = examDate.trim() || todayYmd()
      const tempRow = stateToClinicalRecord(
        { ...DEFAULT_CLINICAL_EXAM, teeth: {} },
        date,
      )
      const prev = bundle.clinicalExams[studentId] ?? []
      const nextRecords = sortClinicalExamRecords([...prev, tempRow])
      commit({
        ...bundle,
        clinicalExams: {
          ...bundle.clinicalExams,
          [studentId]: nextRecords,
        },
        profiles: applyLatestVision(studentId, nextRecords, bundle.profiles),
      })

      void createClinicalExamInNeon({ studentId, examDate: date })
        .then((server) => {
          setBundle((b) => {
            const list = replaceExamInStudentList(
              b.clinicalExams[studentId] ?? [],
              tempRow.id,
              server,
            )
            const next = {
              ...b,
              clinicalExams: { ...b.clinicalExams, [studentId]: list },
            }
            persistMedicalBundle(next)
            return next
          })
        })
        .catch((err) => console.warn('[clinical-exams] create:', err))

      return tempRow.id
    },
    [bundle, commit, applyLatestVision],
  )

  const updateClinicalExamRecord = useCallback(
    (studentId: string, examId: string, state: ClinicalExamState) => {
      if (!studentId || !examId) return
      const prev = bundle.clinicalExams[studentId] ?? []
      const nextRecords = sortClinicalExamRecords(
        prev.map((r) =>
          r.id === examId
            ? {
                ...r,
                state: {
                  ...state,
                  teeth: { ...state.teeth },
                },
                savedAt: new Date().toISOString(),
              }
            : r,
        ),
      )
      commit({
        ...bundle,
        clinicalExams: {
          ...bundle.clinicalExams,
          [studentId]: nextRecords,
        },
        profiles: applyLatestVision(studentId, nextRecords, bundle.profiles),
      })
      scheduleNeonPatch(examId, studentId, state)
    },
    [bundle, commit, applyLatestVision, scheduleNeonPatch],
  )

  const updateClinicalExamDate = useCallback(
    (studentId: string, examId: string, examDate: string) => {
      if (!studentId || !examId) return
      const date = examDate.trim() || todayYmd()
      const prev = bundle.clinicalExams[studentId] ?? []
      const nextRecords = sortClinicalExamRecords(
        prev.map((r) =>
          r.id === examId ? { ...r, examDate: date } : r,
        ),
      )
      commit({
        ...bundle,
        clinicalExams: {
          ...bundle.clinicalExams,
          [studentId]: nextRecords,
        },
        profiles: applyLatestVision(studentId, nextRecords, bundle.profiles),
      })

      if (isNeonClinicalExamId(examId)) {
        const row = nextRecords.find((r) => r.id === examId)
        void updateClinicalExamInNeon({
          id: examId,
          examDate: date,
          state: row?.state,
        }).catch((err) => console.warn('[clinical-exams] date:', err))
      }
    },
    [bundle, commit, applyLatestVision],
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
      listClinicalExams,
      getClinicalExamRecord,
      createClinicalExam,
      updateClinicalExamRecord,
      updateClinicalExamDate,
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
      listClinicalExams,
      getClinicalExamRecord,
      createClinicalExam,
      updateClinicalExamRecord,
      updateClinicalExamDate,
    ],
  )

  return (
    <MedicalDataContext.Provider value={value}>
      {children}
    </MedicalDataContext.Provider>
  )
}
