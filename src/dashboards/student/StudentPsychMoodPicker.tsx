import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export type PsychMoodId = 'happy' | 'content' | 'tired' | 'stressed' | 'sad'

/** 7 өдрийн графийн «өнөөрчлөөд» онооны хувь тохируулгыг нэг дороос ашиглана. */
export const PSYCH_MOOD_SCORE_BY_ID: Record<PsychMoodId, number> = {
  happy: 10,
  content: 8,
  tired: 5,
  stressed: 3,
  sad: 1,
}

/** Графийн цэгүүдийн эмоди (сонгогчийнхтай ижил утгаар). */
export const PSYCH_MOOD_LABEL_BY_ID: Record<PsychMoodId, string> = {
  happy: 'Баяртай',
  content: 'Тайван',
  tired: 'Ядарсан',
  stressed: 'Стресс',
  sad: 'Гунигтай',
}

export const PSYCH_MOOD_EMOJI_BY_ID: Record<PsychMoodId, string> = {
  happy: '😊',
  content: '😌',
  tired: '😴',
  stressed: '😰',
  sad: '😢',
}

/** Өнөөдрийн санаг агуулгыг сэтгэл сонголтонд холбох. */
export const PSYCH_MOOD_ADVICE_BY_ID: Record<PsychMoodId, string> = {
  happy:
    'Өөртөө баяртай байгаа чинь чамд хамгийн чухал. Энэ эерэг энергиэ жижиг зүйлээр дамжуулаарай — найздаа смс бичээд, уртхаа сонсоод богино алхалт хий. Өнөөдөр чамд сайхан өдөр болгоорой!',
  content:
    'Амгалан тайван байдал оюун санаанд тогтвор суулгах суурь. Хэдэн минут аажим амссан, биедээ зөөлөн «баярлалаа» гэж өгөөд, урд шөнөийн ахицаа нэгэн мөрөөр тэмдэглээрэй.',
  tired:
    'Ядарсан байх нь бие махбод дохио өгөх нэг хэлбэр. Өнөөдөр урд тавьсан зүйлсээ түр хойшлуулж, ус уугаад, унтах цагаа түрүүлүүлээд үзээрэй. Чи хангалттай сайн оролцож байгаа.',
  stressed:
    'Стресс нь түр зуурын бөгөөд үүнтэйээ зөөлөн тэмцэж болно. 5:5 амсаалтын дасгал (улаан улирлын шигтгэээр) хийнэ үү эсвэл «Одоог л» гэж аажим давтаарай — сэтгэл жаахан тайвшрахад тань туслана.',
  sad:
    'Гунигтай мэдрэмжийг тодорхойлооройгоо бэлгэд — энэ нь сул дорой биш харин чамаас асуух тусламжийн хэмжээ. Дотно хүн үгүй бол сэтгэл зүйчтэй захиа эсвэл хэсэгт байгаа нөөцүүдээ нээж үзээрэй — чамд хамаатай өдөр бүр байна.',
}

const MOODS: {
  id: PsychMoodId
  emoji: string
  labelMn: string
  labelEn: string
}[] = [
  { id: 'happy', emoji: PSYCH_MOOD_EMOJI_BY_ID.happy, labelMn: 'Баяртай', labelEn: 'Happy' },
  { id: 'content', emoji: PSYCH_MOOD_EMOJI_BY_ID.content, labelMn: 'Тайван', labelEn: 'Content' },
  { id: 'tired', emoji: PSYCH_MOOD_EMOJI_BY_ID.tired, labelMn: 'Ядарсан', labelEn: 'Tired' },
  { id: 'stressed', emoji: PSYCH_MOOD_EMOJI_BY_ID.stressed, labelMn: 'Стресс', labelEn: 'Stressed' },
  { id: 'sad', emoji: PSYCH_MOOD_EMOJI_BY_ID.sad, labelMn: 'Гунигтай', labelEn: 'Sad' },
]

/** Өнөөдрийн сэтгэлийн түлхүүр — локал дамжлагад ашиглана. */
export function psychDailyMoodStorageKey(d = new Date()) {
  return `pe-psych-daily-mood-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function loadPsychDailyMoodFromStorage(): PsychMoodId | null {
  try {
    const raw = localStorage.getItem(psychDailyMoodStorageKey())
    if (!raw) return null
    const ok = MOODS.some((m) => m.id === raw)
    return ok ? (raw as PsychMoodId) : null
  } catch {
    return null
  }
}

function storageKeyToday() {
  return psychDailyMoodStorageKey()
}

export default function StudentPsychMoodPicker({
  onMoodChange,
}: {
  onMoodChange?: (mood: PsychMoodId | null) => void
}) {
  const [selected, setSelected] = useState<PsychMoodId | null>(() =>
    loadPsychDailyMoodFromStorage(),
  )

  useEffect(() => {
    onMoodChange?.(selected)
  }, [selected, onMoodChange])

  const pick = useCallback(
    (id: PsychMoodId) => {
      setSelected(id)
      onMoodChange?.(id)
      try {
        localStorage.setItem(storageKeyToday(), id)
      } catch {
        /* ignore */
      }
      const m = MOODS.find((x) => x.id === id)
      toast.success('Баярлалаа!', {
        description: `Өнөөдрийн сэтгэл: ${m?.emoji} ${m?.labelMn}`,
        duration: 2800,
      })
    },
    [onMoodChange],
  )

  return (
    <div className="rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500/[0.12] via-white/55 to-sky-500/[0.14] p-4 shadow-sm backdrop-blur-xl dark:border-violet-400/25 dark:from-violet-500/15 dark:via-white/[0.04] dark:to-sky-500/15 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl border border-violet-400/35 bg-violet-500/15 text-violet-700 shadow-sm dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-200">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 text-left">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            Өнөөдрийн сэтгэл хуваалцах
          </h3>
          <p className="text-[11px] leading-snug text-slate-600 dark:text-violet-100/65">
            Өөрийгөө яаж мэдэрч байгаагаа дарж тэмдэглэнэ үү — зөвхөн танд харагдана.
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:justify-between sm:gap-3"
        role="group"
        aria-label="Өнөөдрийн сэтгэл сонгох"
      >
        {MOODS.map((m) => {
          const active = selected === m.id
          return (
            <motion.button
              key={m.id}
              type="button"
              aria-pressed={active}
              aria-label={`${m.labelMn}, ${m.labelEn}`}
              onClick={() => pick(m.id)}
              whileHover={{ y: active ? 0 : -2 }}
              whileTap={{ scale: 0.94 }}
              animate={
                active
                  ? { scale: 1.08 }
                  : { scale: 1 }
              }
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className={`relative flex min-w-[4.25rem] flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-3 shadow-sm outline-none ring-offset-2 ring-offset-transparent transition-[transform,opacity,box-shadow,border-color,background-color] duration-300 ease-out sm:min-w-[4.75rem] sm:flex-none sm:px-3 dark:ring-offset-slate-950 ${
                active
                  ? 'z-[1] border-violet-500/70 bg-white/92 opacity-100 ring-[3px] ring-violet-500/55 shadow-[0_10px_28px_-8px_rgb(139_92_246/0.55),0_0_0_1px_rgb(139_92_246/0.12)_inset] dark:border-violet-400/50 dark:bg-white/12 dark:ring-violet-400/40 dark:shadow-[0_14px_36px_-10px_rgb(139_92_246/0.45)]'
                  : 'border-white/55 bg-white/50 opacity-[0.62] hover:opacity-[0.92] hover:border-violet-400/35 hover:bg-white/75 dark:border-white/10 dark:bg-black/25 dark:hover:border-violet-400/30 dark:hover:bg-black/35'
              }`}
            >
              <span className="select-none text-[2rem] leading-none drop-shadow-sm filter transition-transform duration-300 sm:text-[2.25rem]">
                {m.emoji}
              </span>
              <span className="text-center text-[10px] font-semibold leading-tight text-slate-700 dark:text-violet-100/85">
                {m.labelMn}
              </span>
              {active && (
                <motion.span
                  layoutId="psych-mood-dot"
                  className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-sky-500 shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
