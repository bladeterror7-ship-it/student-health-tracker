import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useAuth } from '../../../context/useAuth'
import { ADD_BUTTONS } from '../constants'
import { useViveraWater } from '../hooks/useViveraWater'
import { progressPercent } from '../utils/goalCalculator'
import GoalCalculator from './GoalCalculator'
import HealthTips from './HealthTips'
import HydrationWarning from './HydrationWarning'
import PlantTracker from './PlantTracker'
import WaterFillMeter from './WaterFillMeter'
import WeeklyStats from './WeeklyStats'

export type ViveraDashboardProps = {
  /** Сурагчийн и-мэйл — эцэг эх хүүхдийнхийг харах үед */
  subjectEmail?: string
  /** Хүүхдийн нэр (эцэг эхийн харагдац) */
  childName?: string
  /** Зөвхөн харах — ус нэмэх, reset хориглоно */
  readOnly?: boolean
  /** Таб дотор — давхар хүрээ/сүүдэргүй */
  embedded?: boolean
}

export default function ViveraDashboard({
  subjectEmail: subjectEmailProp,
  childName,
  readOnly = false,
  embedded = false,
}: ViveraDashboardProps = {}) {
  const { session } = useAuth()
  const email = subjectEmailProp ?? session?.email

  const {
    intakeMl,
    dailyGoalMl,
    weightKg,
    activityId,
    showHydrationWarning,
    updateProfile,
    addWater,
    resetDay,
    dismissWarning,
  } = useViveraWater(email)

  const fillPercent = progressPercent(intakeMl, dailyGoalMl)

  if (!email) return null

  return (
    <section
      className={
        embedded
          ? 'space-y-5'
          : 'overflow-hidden rounded-3xl border border-vivera-primary/20 bg-vivera-surface p-4 shadow-lg sm:p-6'
      }
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-left">
          <motion.h3
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-vivera-primary to-vivera-secondary bg-clip-text text-lg font-bold tracking-tight text-transparent sm:text-xl"
          >
            💧 Vivera Усны Төсөл
            {readOnly && childName ? ` — ${childName}` : ''}
          </motion.h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            {readOnly
              ? 'Хүүхдийнхээ өдөр тутмын ус уух зорилт, ургамлын өсөлт болон 7 хоногийн статистикийг хянаарай.'
              : 'Эрүүл мэндийн хэрэгцээнд нийцсэн ус уух зуршил — зорилтоо тохируулж, ургамалаа ургуул.'}
          </p>
        </div>
        <div className="rounded-2xl border border-vivera-primary/20 bg-white px-4 py-2.5 text-right shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {readOnly ? 'Хүүхдийн өнөөдөр' : 'Өнөөдөр'}
          </p>
          <p className="text-xl font-bold tabular-nums text-vivera-primary">
            {intakeMl}
            <span className="text-sm font-semibold text-slate-500">
              {' '}
              / {dailyGoalMl} мл
            </span>
          </p>
          <p className="text-[11px] text-slate-500">{Math.round(fillPercent)}% биелэлт</p>
        </div>
      </header>

      <div className="mb-4">
        <HydrationWarning
          open={!readOnly && showHydrationWarning}
          onDismiss={dismissWarning}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="grid gap-5 md:grid-cols-[minmax(7rem,8.5rem)_1fr] lg:col-span-7">
          <WaterFillMeter
            fillPercent={fillPercent}
            intakeMl={intakeMl}
            goalMl={dailyGoalMl}
          />

          <div className="flex min-w-0 flex-col gap-3">
            <div className="rounded-2xl border border-vivera-primary/10 bg-white p-3.5 text-sm leading-relaxed shadow-sm">
              <p className="font-semibold text-vivera-primary">Vivera төсөл</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {readOnly
                  ? 'Сурагч сургуулийн Vivera цэнэглэгчээр ус ууж, зорилтоо биелүүлж байгаа явцыг эндээс харна.'
                  : 'Сургуулийн ухаалаг усан цэнэглэгчээр цэвэр ус уух, эко хэрэглээг хэвшүүл. Өдөр бүр жижиг алхмаар зорилтодоо хүр.'}
              </p>
            </div>

            {!readOnly && (
              <>
                <div className="flex flex-wrap gap-2">
                  {ADD_BUTTONS.map(({ ml, label, sub }) => (
                    <button
                      key={ml}
                      type="button"
                      onClick={() => addWater(ml)}
                      className="inline-flex min-w-[130px] flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-vivera-primary to-vivera-secondary px-3 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]"
                    >
                      {label}
                      <span className="text-[10px] font-medium opacity-90">
                        ({sub})
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={resetDay}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Өнөөдрийг шинэчлэх
                </button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <PlantTracker progressPercent={fillPercent} />
        </div>

        <div className="lg:col-span-6">
          <GoalCalculator
            weightKg={weightKg}
            activityId={activityId}
            dailyGoalMl={dailyGoalMl}
            onChange={updateProfile}
            readOnly={readOnly}
          />
        </div>

        <div className="lg:col-span-6">
          <HealthTips />
        </div>

        <div className="lg:col-span-12">
          <WeeklyStats
            email={email}
            dailyGoalMl={dailyGoalMl}
            todayIntakeMl={intakeMl}
          />
        </div>
      </div>
    </section>
  )
}
