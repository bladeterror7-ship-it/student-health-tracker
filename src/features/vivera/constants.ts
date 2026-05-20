/** Vivera design tokens (also mirrored in index.css @theme) */
export const VIVERA_COLORS = {
  primary: '#007AFF',
  secondary: '#34C759',
  background: '#F5F7FA',
  accent: '#FF9500',
} as const

export const ML_PER_KG = 30

export const ACTIVITY_OPTIONS = [
  { id: 'low', label: 'Бага идэвхтэй', multiplier: 1 },
  { id: 'moderate', label: 'Дунд идэвхтэй', multiplier: 1.1 },
  { id: 'high', label: 'Их идэвхтэй', multiplier: 1.2 },
] as const

export type ActivityLevelId = (typeof ACTIVITY_OPTIONS)[number]['id']

export const HEALTH_TIPS = [
  {
    id: 'brain',
    title: 'Тархиа цэнэглэ',
    icon: '🧠',
    body: 'Таны тархины 75% нь уснаас бүрддэг гэдгийг мэдэх үү? Ус дутагдахад анхаарал төвлөрөл буурч, толгой өвдөх нь элбэг байдаг. Хичээлдээ анхааралтай суухыг хүсвэл тархиа тогтмол «цэнэглэж» ус ууж байх хэрэгтэй!',
  },
  {
    id: 'skin',
    title: 'Гэрэлтсэн гоё арьстай болоорой',
    icon: '✨',
    body: 'Гоо сайхны бүтээгдэхүүнээс илүүтэйгээр ус нь арьсыг байгалийн жамаар «гэрэлтүүлдэг». Ус уух нь арьсыг хортой бодисоос цэвэрлэж, өдөржин шинэхэн, толигор харагдуулах болно. Өнөөдөр хэдэн аяга ус уусан бэ?',
  },
  {
    id: 'energy',
    title: 'Энерги цэнэглэх',
    icon: '⚡',
    body: 'Ядаргаа мэдрэгдэх нь ихэнхдээ ус дутагдсаных байдаг. Vivera усны саваа дүүргээд «батарей»-гаа 100% болгоорой! Эрч хүчтэй байх хамгийн хялбар арга бол ус уух юм.',
  },
  {
    id: 'habit',
    title: 'Таны өсөлт',
    icon: '🌱',
    body: 'Таны уусан ус бол ургамалд тань өгч буй «амьдралын шим тэжээл» юм. Өдөр бүр зорилгоо биелүүлснээр ургамал тань улам томорч, цэцэглэнэ. Өнөөдөр ургамалдаа хэдэн дусал ус өгөх вэ?',
  },
] as const

/** Нэг дор нэмэхэд анхааруулах босго (мл) */
export const SINGLE_ADD_WARNING_ML = 500

export const ADD_BUTTONS = [
  { ml: 250, label: '+250 мл', sub: 'Аяга ус' },
  { ml: 500, label: '+500 мл', sub: 'Vivera сав' },
] as const

export const PLANT_STAGES = [
  { minPercent: 0, label: 'Үр', emoji: '🌰' },
  { minPercent: 25, label: 'Өлс', emoji: '🌱' },
  { minPercent: 50, label: 'Өсөж буй', emoji: '🪴' },
  { minPercent: 75, label: 'Цэцэглэх гэж', emoji: '🌿' },
  { minPercent: 100, label: 'Цэцэглэсэн', emoji: '🌸' },
] as const
