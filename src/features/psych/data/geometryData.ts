export type GeometryShapeId =
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'circle'
  | 'zigzag'

export type GeometryShape = {
  id: GeometryShapeId
  label: string
  mainTrait: string
  influenceTrait: string
  challengeTrait: string
}

export const PSYCH_GEOMETRY_SHAPES: GeometryShape[] = [
  {
    id: 'square',
    label: 'Дөрвөлжин',
    mainTrait: 'Хөдөлмөрч, системчлэгч, нямбай',
    influenceTrait: 'Төлөвлөгөө, дэг журам, найдвартай байдал',
    challengeTrait: 'Хэт болгоомжтой, өөрчлөлтөд эсэргүүцэх хандлага',
  },
  {
    id: 'triangle',
    label: 'Гурвалжин',
    mainTrait: 'Удирдагч, эрч хүчтэй, эгоцентризм',
    influenceTrait: 'Зорилго, шийдэмгий байдал, удирдах чадвар',
    challengeTrait: 'Хэт өрсөлдөх, бусдын мэдрэмжийг үл тоомсорлох',
  },
  {
    id: 'rectangle',
    label: 'Тэгш өнцөгт',
    mainTrait: 'Шилжилт, өөрчлөлт, хайгуул хийж буй',
    influenceTrait: 'Суралцах, дасан зохицох, шинэ зүйл турших',
    challengeTrait: 'Тогтворгүй байдал, өөрийгөө олж буй үе',
  },
  {
    id: 'circle',
    label: 'Дугуй',
    mainTrait: 'Нийцэл, амар амгалан, сайн сэтгэл зүйч',
    influenceTrait: 'Харилцаа, эмпати, багийн ажиллагаа',
    challengeTrait: 'Шийдвэр гаргахдаа удаан, хил хязгаар тодорхойлоход хүцүү',
  },
  {
    id: 'zigzag',
    label: 'Тахир зураас',
    mainTrait: 'Бүтээлч, задгай сэтгэлгээтэй',
    influenceTrait: 'Шинэ санаа, уран бүтээл, гадаад хайрцаг',
    challengeTrait: 'Дэг журамгүй, төвлөрөл алдагдах, хэт мэдрэмтгий',
  },
]

export const GEOMETRY_INTRO = {
  title: 'Сэтгэц геометрийн тест',
  description:
    'Доорх 5 дүрсийг таалагдах дарааллаар 1–5-аар эрэмбэлнэ үү. 1-р сонголт — үндсэн зан төлөв; 2–4 — нөлөөлөх хүчин зүйлс; 5 — илэрч болох бэрхшээл.',
}
