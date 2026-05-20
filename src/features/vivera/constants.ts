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
    title: 'Тархины үйл ажиллагаа',
    icon: '🧠',
    body: 'Хөнгөн цэнхэр ус тархины хүчил-суурь тэнцвэрт, анхаарал төвлөрөлд тустай. Өглөө эхлээд 1–2 аяга уух нь сайн эхлэл.',
  },
  {
    id: 'skin',
    title: 'Арьс',
    icon: '✨',
    body: 'Хангалттай ус уух нь арьсыг уян хатан, гэрэлтүүлэг харагдуулахад тусална. Өдөржингөө жижиг хэмжээгээр уух нь илүү үр дүнтэй.',
  },
  {
    id: 'energy',
    title: 'Энерги',
    icon: '⚡',
    body: 'Бага зэрэг шингэн алдагдахад ядаргаа мэдрэгддэг. Vivera саваар тогтмол цэнэглэж, эрч хүчээ сэргээнэ үү.',
  },
  {
    id: 'habit',
    title: 'Зуршил',
    icon: '🌱',
    body: 'Усны ургамалаа ургуулж, өдөр бүр жижиг зорилго тавь. Зорилтодоо хүрэх тусам таны «усны ургамал» дэлгэрнэ.',
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
