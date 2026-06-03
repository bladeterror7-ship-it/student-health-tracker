export type ToothDef = {
  id: string
  label: string
  arch: 'upper-primary' | 'upper-permanent' | 'lower-primary' | 'lower-permanent'
  side: 'left' | 'right'
}

/** Сүүн + байнгын шүд — эмчийн харагдах дараалал */
export const DENTAL_TEETH: ToothDef[] = [
  { id: 'UR-P-5', label: '55', arch: 'upper-primary', side: 'right' },
  { id: 'UR-P-4', label: '54', arch: 'upper-primary', side: 'right' },
  { id: 'UR-P-3', label: '53', arch: 'upper-primary', side: 'right' },
  { id: 'UR-P-2', label: '52', arch: 'upper-primary', side: 'right' },
  { id: 'UR-P-1', label: '51', arch: 'upper-primary', side: 'right' },
  { id: 'UL-P-1', label: '61', arch: 'upper-primary', side: 'left' },
  { id: 'UL-P-2', label: '62', arch: 'upper-primary', side: 'left' },
  { id: 'UL-P-3', label: '63', arch: 'upper-primary', side: 'left' },
  { id: 'UL-P-4', label: '64', arch: 'upper-primary', side: 'left' },
  { id: 'UL-P-5', label: '65', arch: 'upper-primary', side: 'left' },
  { id: 'UR-M-4', label: '14', arch: 'upper-permanent', side: 'right' },
  { id: 'UR-M-3', label: '13', arch: 'upper-permanent', side: 'right' },
  { id: 'UR-M-2', label: '12', arch: 'upper-permanent', side: 'right' },
  { id: 'UR-M-1', label: '11', arch: 'upper-permanent', side: 'right' },
  { id: 'UL-M-1', label: '21', arch: 'upper-permanent', side: 'left' },
  { id: 'UL-M-2', label: '22', arch: 'upper-permanent', side: 'left' },
  { id: 'UL-M-3', label: '23', arch: 'upper-permanent', side: 'left' },
  { id: 'UL-M-4', label: '24', arch: 'upper-permanent', side: 'left' },
  { id: 'LR-M-4', label: '44', arch: 'lower-permanent', side: 'right' },
  { id: 'LR-M-3', label: '43', arch: 'lower-permanent', side: 'right' },
  { id: 'LR-M-2', label: '42', arch: 'lower-permanent', side: 'right' },
  { id: 'LR-M-1', label: '41', arch: 'lower-permanent', side: 'right' },
  { id: 'LL-M-1', label: '31', arch: 'lower-permanent', side: 'left' },
  { id: 'LL-M-2', label: '32', arch: 'lower-permanent', side: 'left' },
  { id: 'LL-M-3', label: '33', arch: 'lower-permanent', side: 'left' },
  { id: 'LL-M-4', label: '34', arch: 'lower-permanent', side: 'left' },
  { id: 'LR-P-5', label: '85', arch: 'lower-primary', side: 'right' },
  { id: 'LR-P-4', label: '84', arch: 'lower-primary', side: 'right' },
  { id: 'LR-P-3', label: '83', arch: 'lower-primary', side: 'right' },
  { id: 'LR-P-2', label: '82', arch: 'lower-primary', side: 'right' },
  { id: 'LR-P-1', label: '81', arch: 'lower-primary', side: 'right' },
  { id: 'LL-P-1', label: '71', arch: 'lower-primary', side: 'left' },
  { id: 'LL-P-2', label: '72', arch: 'lower-primary', side: 'left' },
  { id: 'LL-P-3', label: '73', arch: 'lower-primary', side: 'left' },
  { id: 'LL-P-4', label: '74', arch: 'lower-primary', side: 'left' },
  { id: 'LL-P-5', label: '75', arch: 'lower-primary', side: 'left' },
]

export const TOOTH_STATUS_STYLES = {
  healthy:
    'bg-green-50 text-green-600 border-green-300 dark:bg-green-950/35 dark:text-green-200 dark:border-green-500/40',
  caries:
    'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/40 dark:text-red-200 dark:border-red-500/45',
  filled:
    'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500/45',
} as const

export const TOOTH_STATUS_LABELS = {
  healthy: 'Эрүүл',
  caries: 'Цоорсон',
  filled: 'Ломбодсон',
} as const
