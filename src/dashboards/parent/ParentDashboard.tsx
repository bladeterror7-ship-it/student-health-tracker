import { motion } from 'framer-motion'
import {
  Apple,
  Droplets,
  Footprints,
  HeartPulse,
  MoonStar,
  Scale,
  Sparkles,
  Trees,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import { ViveraDashboard } from '../../features/vivera'
import { useMedicalData } from '../../hooks/useMedicalData'
import ParentChildHealthPanel from './ParentChildHealthPanel'

type BmiBand = 'under' | 'normal' | 'over' | 'obese'

function classifyBmi(bmi: number): BmiBand {
  if (bmi < 18.5) return 'under'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'over'
  return 'obese'
}

const bandLabels: Record<
  BmiBand,
  { title: string; hint: string; barFrom: string; barTo: string }
> = {
  under: {
    title: 'Жингийн дутагдал',
    hint: 'Эрч хүчээ нэмэгдүүлэхэд анхаараарай.',
    barFrom: 'from-sky-400',
    barTo: 'to-indigo-500',
  },
  normal: {
    title: 'Хэвийн',
    hint: 'Таны BMI хэвийн хэмжээнд байна.',
    barFrom: 'from-emerald-400',
    barTo: 'to-teal-500',
  },
  over: {
    title: 'Илүүдэл жин',
    hint: 'Идэвх болон хоолны тэнцвэр чухал.',
    barFrom: 'from-amber-400',
    barTo: 'to-orange-600',
  },
  obese: {
    title: 'Өндөр эрсдэлтэй түвшин',
    hint: 'Эмч, ЭМЯ-ийн зөвлөгөө авахыг зөвлөж байна.',
    barFrom: 'from-rose-500',
    barTo: 'to-red-700',
  },
}

export default function ParentDashboard() {
  const { session } = useAuth()
  const { students } = useStudentRegistry()
  const { getProfileResolved } = useMedicalData()

  const linkedChild = useMemo(() => {
    if (!session?.linkedStudentId) return null
    return students.find((s) => s.id === session.linkedStudentId) ?? null
  }, [students, session?.linkedStudentId])

  const childProfile = session?.linkedStudentId
    ? getProfileResolved(session.linkedStudentId)
    : null

  const [weight, setWeight] = useState('42')
  const [height, setHeight] = useState('155')

  const parsed = useMemo(() => {
    const w = Number(weight.replace(',', '.'))
    const h = Number(height.replace(',', '.'))
    return { w, h }
  }, [weight, height])

  const bmi = useMemo(() => {
    const { w, h } = parsed
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
      return null
    const m = h / 100
    const val = w / (m * m)
    return Math.round(val * 10) / 10
  }, [parsed])

  const band = bmi != null ? classifyBmi(bmi) : null
  const meta = band ? bandLabels[band] : null

  /** Map BMI ~15–35 to 0–100 for gauge */
  const gaugePct =
    bmi == null
      ? 0
      : Math.min(100, Math.max(0, ((bmi - 15) / (35 - 15)) * 100))

  const advice = useMemo(() => {
    if (!band) return []
    const nutrition =
      band === 'under'
        ? [
            'Өдөрт 3 удаа тогтмол хооллох, уураг болон үр төрөгийн түүхий эдийг нэмэгдүүлнэ.',
            'Жимс ногоо, самар, буурцагт ургамлыг орлуулах цэнэглэгээ.',
          ]
        : band === 'normal'
          ? [
              'Олон төрлийн хүнсний үндсэн бүлгүүдийг тэнцвэртэй хуваах.',
              'Нэмэлтэлэг уснаас гадна давс, чихэрлэг ундааг хязгаарлах.',
            ]
          : [
              'Хэсэгчилсэн орцыг тоолох эсвэл гэр бүлээрээ хамтдаа цагийн хооллох.',
              'Шингэн калори (ундаа, шүүс)-г бууруулах нь хурдан үр дүн өгнө.',
            ]

    const workout =
      band === 'under'
        ? [
            'Хүчийн дасгал бага даацтайгаар долоо хоногт 2–3 удаа.',
            'Өдөр тутмын алхалт 6,000–8,000 алхмаар өсгөнө.',
          ]
        : band === 'normal'
          ? [
              'Долоо хоногт дор хаяж 150 минут дунд хэмжээний аэробик.',
              'Сунгалт + кор түгжрэлийн эсрэг хөдөлгөөнүүд.',
            ]
          : [
              'Өвдөлтгүй алхах, дуугуй, усны аэробик зэрэг өндөр түвшний даац биш.',
              'Биеийн темпээ хянаж, аажмаар хугацааг уртасгана.',
            ]

    const lifestyle =
      band === 'under'
        ? [
            'Нойрыг тогтвортой болгох — өсөлт, сэтгэл зүйд шууд нөлөөлнө.',
            'Стрессээ өдөр тутмын бага амралтаар тараана.',
          ]
        : band === 'normal'
          ? [
              'Дэлгэцийн цагийг өдөрт 2 цагаас багасгах зорилт тавих.',
              'Гэр бүлээрээ идэвхтэй амралт төлөвлөх.',
            ]
          : [
              'Ойрын зайг алхаж явах дадлыг өдөр тутамд суулгах.',
              'Урьдчилан сэргийлэх үзлэг хийлгэж, урт хугацааны төлөвлөгөө гаргана.',
            ]

    return [
      { title: 'Хоол зүй', icon: Apple, bullets: nutrition },
      { title: 'Дасгал хөдөлгөөн', icon: Footprints, bullets: workout },
      { title: 'Амьдралын хэв маяг', icon: Trees, bullets: lifestyle },
    ]
  }, [band])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
            Эцэг эхийн портал
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Хүүхдийн BMI тооцоолуур & зөвлөгөө
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-sky-50/75">
            Жин болон өндрийг оруулахад BMI автоматаар шинэчлэгдэнэ.
          </p>
        </div>
      </header>

      {session?.linkedStudentName && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-sky-400/35 bg-gradient-to-br from-sky-500/12 via-white/80 to-emerald-500/10 p-4 shadow-sm backdrop-blur-xl dark:border-sky-500/25 dark:from-sky-500/15 dark:via-slate-950/50 dark:to-emerald-500/10"
        >
          <motion.div className="flex flex-wrap items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/35 bg-sky-500/15 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/20 dark:text-sky-100">
              <HeartPulse className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
                Холбогдсон сурагч
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-white">
                {session.linkedStudentName}
              </p>
              {childProfile ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-sky-50/75">
                  Ерөнхий төлөв:{' '}
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {childProfile.overallStatus}
                  </span>
                  {' · '}
                  Сүүлийн үзлэг: {childProfile.lastCheckup}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500 dark:text-sky-100/55">
                  Эмчийн үзлэгийн мэдээлэл одоогоор бүртгэгдээгүй байна.
                </p>
              )}
            </div>
          </motion.div>
        </motion.section>
      )}

      {linkedChild && session?.linkedStudentId ? (
        <ParentChildHealthPanel
          child={linkedChild}
          studentId={session.linkedStudentId}
        />
      ) : null}

      {linkedChild ? (
        <ViveraDashboard
          subjectEmail={linkedChild.email}
          childName={linkedChild.fullName}
          readOnly
        />
      ) : session?.role === 'parent' ? (
        <section className="rounded-2xl border border-vivera-primary/20 bg-vivera-surface/80 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">💧 Vivera Усны Төсөл</p>
          <p className="mt-1">
            Хүүхдийн усны мэдээлэл харахын тулд бүртгэлд хүүхдийн и-мэйл эсвэл
            нэрийг зөв оруулсан эсэхийг шалгана уу.
          </p>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
        <motion.section
          layout
          className="rounded-3xl border border-white/55 bg-white/75 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Scale className="size-5 text-orange-500" />
            BMI тооцоолуур
          </div>

          <div className="mt-5 grid gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-sky-50/70">
                Биеийн жин (кг)
              </span>
              <input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-lg font-semibold tracking-tight outline-none ring-orange-400/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600 dark:text-sky-50/70">
                Өндөр (см)
              </span>
              <input
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-lg font-semibold tracking-tight outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sky-100/55">
                  Биеийн жингийн индекс
                </p>
                <p className="mt-1 text-4xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {bmi ?? '—'}
                </p>
              </div>
              {meta && (
                <motion.span
                  key={band}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white shadow-md ${meta.barFrom} ${meta.barTo}`}
                >
                  {meta.title}
                </motion.span>
              )}
            </div>

            <div className="relative mt-2 h-4 overflow-hidden rounded-full bg-slate-200/90 dark:bg-black/45">
              <div className="absolute inset-y-0 left-0 w-[28.5%] bg-gradient-to-r from-sky-400 to-indigo-400 opacity-65" />
              <div className="absolute inset-y-0 left-[28.5%] w-[41.5%] bg-gradient-to-r from-emerald-400 to-teal-400 opacity-65" />
              <div className="absolute inset-y-0 left-[70%] w-[21.5%] bg-gradient-to-r from-amber-400 to-orange-500 opacity-65" />
              <div className="absolute inset-y-0 left-[91.5%] right-0 bg-gradient-to-r from-rose-500 to-red-600 opacity-65" />

              {bmi != null && (
                <motion.div
                  layout
                  className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-slate-900 shadow-lg dark:bg-white dark:border-slate-900"
                  style={{ left: `${gaugePct}%` }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-sky-100/45">
              <span>&lt;18.5</span>
              <span>18.5–24.9</span>
              <span>25–29.9</span>
              <span>≥30</span>
            </div>
            {meta && (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-sky-50/75">
                {meta.hint}
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-2 rounded-2xl border border-sky-400/25 bg-sky-500/10 p-4 text-xs text-sky-950 dark:bg-sky-500/15 dark:text-sky-50">
            <div className="flex items-center gap-2 font-semibold">
              <Droplets className="size-4" />
              Санамж
            </div>
            <p className="leading-relaxed opacity-90">
              BMI нь ерөнхий үзүүлэлт бөгөөд нас, хүйс, булчинны масс зэргийг
              тооцохгүй. Эмчийн үзлэгтэй хослуулах нь зүйтэй.
            </p>
          </div>
        </motion.section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Sparkles className="size-5 text-emerald-500" />
            Зөвлөгөө — BMI-д үндэслэсэн
          </div>

          {!band && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-4 py-6 text-center text-sm text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-sky-50/70">
              Жин болон өндрийг зөв оруулна уу.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {advice.map((block, idx) => {
              const Icon = block.icon
              return (
                <motion.article
                  key={block.title}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex h-full flex-col rounded-3xl border border-white/55 bg-white/72 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/45"
                >
                  <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400/25 to-emerald-400/25 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white">
                    <Icon className="size-4 text-orange-600 dark:text-orange-300" />
                    {block.title}
                  </div>
                  <ul className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-sky-50/85">
                    {block.bullets.map((line) => (
                      <li
                        key={line}
                        className="flex gap-2 rounded-xl bg-slate-50/90 px-3 py-2 dark:bg-black/35"
                      >
                        <MoonStar className="mt-0.5 size-4 shrink-0 text-orange-500/90" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
