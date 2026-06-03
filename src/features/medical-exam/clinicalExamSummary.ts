import { DENTAL_TEETH } from './dentalChart'
import type { ClinicalExamState } from './types'

export function countTeethByStatus(state: ClinicalExamState) {
  let caries = 0
  let filled = 0
  for (const t of DENTAL_TEETH) {
    const s = state.teeth[t.id] ?? 'healthy'
    if (s === 'caries') caries += 1
    if (s === 'filled') filled += 1
  }
  return { caries, filled }
}

export function buildClinicalExamSummary(
  state: ClinicalExamState,
  examDate?: string,
): string {
  const { caries, filled } = countTeethByStatus(state)
  const cariesList = DENTAL_TEETH.filter(
    (t) => (state.teeth[t.id] ?? 'healthy') === 'caries',
  )
    .map((t) => t.label)
    .join(', ')
  const filledList = DENTAL_TEETH.filter(
    (t) => (state.teeth[t.id] ?? 'healthy') === 'filled',
  )
    .map((t) => t.label)
    .join(', ')

  const lines = [
    '【Эмчийн үзлэг】',
    ...(examDate ? [`Огноо: ${examDate}`] : []),
    `Шүд: цоорсон ${caries}, ломбодсон ${filled}${cariesList ? ` (${cariesList})` : ''}${filledList ? `; ломбодсон: ${filledList}` : ''}`,
    `Хараа: OD ${state.visionOD.toFixed(1)}, OS ${state.visionOS.toFixed(1)}`,
    `Амьсгал: ханиалга ${state.cough ? 'тийм' : 'үгүй'}, сонсгол ${state.breathAbnormal ? 'хэвийн бус' : 'хэвийн'}`,
  ]
  return lines.join('\n')
}
