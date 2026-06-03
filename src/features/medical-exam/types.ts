export type ToothStatus = 'healthy' | 'caries' | 'filled'

export type ClinicalExamState = {
  teeth: Record<string, ToothStatus>
  visionOD: number
  visionOS: number
  /** Systolic (дээд) mmHg — 0 = оруулаагүй */
  bpSystolic: number
  /** Diastolic (доод) mmHg */
  bpDiastolic: number
  /** Зүрхний цохилт BPM */
  pulseBpm: number
  cough: boolean
  breathAbnormal: boolean
}

/** Нэг үзлэгийн түүх — огноо, хадгалсан цаг, өгөгдөл */
export type ClinicalExamRecord = {
  id: string
  /** YYYY-MM-DD */
  examDate: string
  savedAt: string
  state: ClinicalExamState
}

export const DEFAULT_CLINICAL_EXAM: ClinicalExamState = {
  teeth: {},
  visionOD: 1.0,
  visionOS: 1.0,
  bpSystolic: 0,
  bpDiastolic: 0,
  pulseBpm: 0,
  cough: false,
  breathAbnormal: false,
}
