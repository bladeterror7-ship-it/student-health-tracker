import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  DENTAL_TEETH,
  TOOTH_STATUS_LABELS,
  TOOTH_STATUS_STYLES,
  type ToothDef,
} from '../dentalChart'
import { countTeethByStatus } from '../clinicalExamSummary'
import type { ClinicalExamState, ToothStatus } from '../types'
import ToothSvg from './ToothSvg'

const STATUS_CYCLE: ToothStatus[] = ['healthy', 'caries', 'filled']

function ArchRow({
  title,
  teeth,
  state,
  openMenuId,
  onOpenMenu,
  onSetStatus,
}: {
  title: string
  teeth: ToothDef[]
  state: ClinicalExamState
  openMenuId: string | null
  onOpenMenu: (id: string | null) => void
  onSetStatus: (id: string, status: ToothStatus) => void
}) {
  const right = teeth.filter((t) => t.side === 'right')
  const left = teeth.filter((t) => t.side === 'left')

  return (
    <div className="rounded-2xl border border-emerald-200/50 bg-white/70 p-3 dark:border-emerald-500/20 dark:bg-black/25">
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-200/80">
        {title}
      </p>
      <div className="flex items-end justify-center gap-1">
        <div className="flex items-end gap-0.5">
          {[...right].reverse().map((t) => (
            <ToothButton
              key={t.id}
              tooth={t}
              status={state.teeth[t.id] ?? 'healthy'}
              menuOpen={openMenuId === t.id}
              onToggleMenu={() => onOpenMenu(openMenuId === t.id ? null : t.id)}
              onSetStatus={(s) => onSetStatus(t.id, s)}
            />
          ))}
        </div>
        <div className="mx-1 h-10 w-px bg-emerald-300/60 dark:bg-emerald-500/30" aria-hidden />
        <div className="flex items-end gap-0.5">
          {left.map((t) => (
            <ToothButton
              key={t.id}
              tooth={t}
              status={state.teeth[t.id] ?? 'healthy'}
              menuOpen={openMenuId === t.id}
              onToggleMenu={() => onOpenMenu(openMenuId === t.id ? null : t.id)}
              onSetStatus={(s) => onSetStatus(t.id, s)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ToothButton({
  tooth,
  status,
  menuOpen,
  onToggleMenu,
  onSetStatus,
}: {
  tooth: ToothDef
  status: ToothStatus
  menuOpen: boolean
  onToggleMenu: () => void
  onSetStatus: (s: ToothStatus) => void
}) {
  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onToggleMenu}
        whileTap={{ scale: 0.92 }}
        className={`flex min-w-[2rem] flex-col items-center rounded-xl border px-0.5 py-1 transition ${TOOTH_STATUS_STYLES[status]}`}
        aria-label={`Шүд ${tooth.label} — ${TOOTH_STATUS_LABELS[status]}`}
      >
        <ToothSvg tooth={tooth} />
        <span className="text-[9px] font-bold tabular-nums">{tooth.label}</span>
      </motion.button>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute left-1/2 top-full z-20 mt-1 w-28 -translate-x-1/2 rounded-xl border border-slate-200/90 bg-white p-1 shadow-lg dark:border-white/15 dark:bg-slate-900"
          >
            {STATUS_CYCLE.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSetStatus(s)}
                className={`block w-full rounded-lg px-2 py-1.5 text-left text-[10px] font-semibold ${TOOTH_STATUS_STYLES[s]}`}
              >
                {TOOTH_STATUS_LABELS[s]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DentalMapSection({
  state,
  onChange,
}: {
  state: ClinicalExamState
  onChange: (patch: Partial<ClinicalExamState>) => void
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const counts = useMemo(() => countTeethByStatus(state), [state])

  const upperPrimary = DENTAL_TEETH.filter((t) => t.arch === 'upper-primary')
  const upperPermanent = DENTAL_TEETH.filter((t) => t.arch === 'upper-permanent')
  const lowerPermanent = DENTAL_TEETH.filter((t) => t.arch === 'lower-permanent')
  const lowerPrimary = DENTAL_TEETH.filter((t) => t.arch === 'lower-primary')

  function setTooth(id: string, status: ToothStatus) {
    onChange({ teeth: { ...state.teeth, [id]: status } })
    setOpenMenuId(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Шүдний зураглал</p>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-red-600 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            Цоорсон: {counts.caries}
          </span>
          <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-blue-600 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-200">
            Ломбодсон: {counts.filled}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-emerald-100/55">
        Шүд дээр дарж төлөв сонгоно — эрүүл · цоорсон · ломбодсон
      </p>

      <div className="space-y-2">
        <ArchRow
          title="Дээд — сүүн шүд"
          teeth={upperPrimary}
          state={state}
          openMenuId={openMenuId}
          onOpenMenu={setOpenMenuId}
          onSetStatus={setTooth}
        />
        <ArchRow
          title="Дээд — байнгын шүд"
          teeth={upperPermanent}
          state={state}
          openMenuId={openMenuId}
          onOpenMenu={setOpenMenuId}
          onSetStatus={setTooth}
        />
        <ArchRow
          title="Доод — байнгын шүд"
          teeth={lowerPermanent}
          state={state}
          openMenuId={openMenuId}
          onOpenMenu={setOpenMenuId}
          onSetStatus={setTooth}
        />
        <ArchRow
          title="Доод — сүүн шүд"
          teeth={lowerPrimary}
          state={state}
          openMenuId={openMenuId}
          onOpenMenu={setOpenMenuId}
          onSetStatus={setTooth}
        />
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        {(['healthy', 'caries', 'filled'] as ToothStatus[]).map((s) => (
          <span
            key={s}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${TOOTH_STATUS_STYLES[s]}`}
          >
            {TOOTH_STATUS_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  )
}
