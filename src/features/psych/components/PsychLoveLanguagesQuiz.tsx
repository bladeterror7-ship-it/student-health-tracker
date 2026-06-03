import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Heart, RotateCcw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  LOVE_LANGUAGE_CODE_ORDER,
  LOVE_LANGUAGE_QUESTIONS,
  LOVE_LANGUAGE_RESULTS,
  LOVE_LANGUAGES_INTRO,
  type LoveLanguageCode,
} from '../data/loveLanguagesData'
import { PsychChoiceButton, PsychSectionShell } from './PsychSectionShell'

type Phase = 'intro' | 'quiz' | 'result'

function countScores(answers: Record<number, LoveLanguageCode>) {
  const counts: Record<LoveLanguageCode, number> = {
    A: 0,
    B: 0,
    V: 0,
    G: 0,
    D: 0,
  }
  for (const code of Object.values(answers)) {
    counts[code] += 1
  }
  return counts
}

function topTwoCodes(counts: Record<LoveLanguageCode, number>): LoveLanguageCode[] {
  return [...LOVE_LANGUAGE_CODE_ORDER]
    .sort((a, b) => counts[b] - counts[a] || LOVE_LANGUAGE_CODE_ORDER.indexOf(a) - LOVE_LANGUAGE_CODE_ORDER.indexOf(b))
    .slice(0, 2)
}

export default function PsychLoveLanguagesQuiz() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, LoveLanguageCode>>({})

  const total = LOVE_LANGUAGE_QUESTIONS.length
  const question = LOVE_LANGUAGE_QUESTIONS[step]
  const selected = question ? answers[question.id] : undefined
  const progress = phase === 'quiz' ? ((step + 1) / total) * 100 : 0

  const topTwo = useMemo(() => topTwoCodes(countScores(answers)), [answers])

  function startQuiz() {
    setPhase('quiz')
    setStep(0)
    setAnswers({})
  }

  function resetAll() {
    setPhase('intro')
    setStep(0)
    setAnswers({})
  }

  function pick(code: LoveLanguageCode) {
    if (!question) return
    setAnswers((prev) => ({ ...prev, [question.id]: code }))
  }

  function goNext() {
    if (!selected) return
    if (step >= total - 1) {
      setPhase('result')
      return
    }
    setStep((s) => s + 1)
  }

  function goBack() {
    if (step <= 0) {
      setPhase('intro')
      return
    }
    setStep((s) => s - 1)
  }

  return (
    <PsychSectionShell
      icon={Heart}
      title={LOVE_LANGUAGES_INTRO.title}
      subtitle={`${LOVE_LANGUAGES_INTRO.author}, ${LOVE_LANGUAGES_INTRO.year}`}
    >
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {LOVE_LANGUAGES_INTRO.paragraphs.map((p) => (
              <p
                key={p.slice(0, 24)}
                className="text-sm leading-relaxed text-slate-700 dark:text-emerald-50/88"
              >
                {p}
              </p>
            ))}
            <button
              type="button"
              onClick={startQuiz}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/25 transition hover:opacity-95"
            >
              <Sparkles className="size-4" />
              Тест эхлүүлэх ({total} асуулт)
            </button>
          </motion.div>
        )}

        {phase === 'quiz' && question && (
          <motion.div
            key={`q-${question.id}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-4"
          >
            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-violet-700 dark:text-violet-200">
                <span>
                  Асуулт {step + 1} / {total}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-violet-500/15">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>

            <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-white">
              Аль нь танд илүү тохирох вэ?
            </p>

            <div className="space-y-2">
              <PsychChoiceButton
                active={selected === question.option1.code}
                onClick={() => pick(question.option1.code)}
              >
                {question.option1.text}
              </PsychChoiceButton>
              <PsychChoiceButton
                active={selected === question.option2.code}
                onClick={() => pick(question.option2.code)}
              >
                {question.option2.text}
              </PsychChoiceButton>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-black/30 dark:text-white"
              >
                <ChevronLeft className="size-4" />
                Буцах
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={goNext}
                className="inline-flex flex-[1.2] items-center justify-center gap-1 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {step >= total - 1 ? 'Үр дүн харах' : 'Дараах'}
                <ChevronRight className="size-4" />
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-sm leading-relaxed text-slate-700 dark:text-emerald-50/88">
              Таны хамгийн их тохирсон хайрын хэл (эхний 2):
            </p>
            <div className="space-y-3">
              {topTwo.map((code, i) => {
                const r = LOVE_LANGUAGE_RESULTS[code]
                return (
                  <motion.article
                    key={code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-violet-300/45 bg-gradient-to-br from-white/90 to-violet-50/80 p-4 shadow-sm dark:border-violet-400/30 dark:from-white/8 dark:to-violet-950/40"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white">
                        {r.letter}
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                          {i === 0 ? 'Үндсэн' : 'Хоёрдугаар'} хайрын хэл
                        </p>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                          {r.label}
                        </h4>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-emerald-50/88">
                      {r.description}
                    </p>
                    <p className="mt-2 rounded-xl bg-violet-500/10 px-3 py-2 text-xs leading-relaxed text-violet-900 dark:bg-violet-500/15 dark:text-violet-100">
                      <span className="font-semibold">Зөвлөмж: </span>
                      {r.tips}
                    </p>
                  </motion.article>
                )
              })}
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/50 bg-white/70 px-4 py-2.5 text-sm font-semibold text-violet-900 dark:border-violet-400/35 dark:bg-black/30 dark:text-violet-100"
            >
              <RotateCcw className="size-4" />
              Дахин эхлэх
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PsychSectionShell>
  )
}
