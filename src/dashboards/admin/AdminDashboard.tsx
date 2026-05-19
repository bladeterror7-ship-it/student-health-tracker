import { motion } from 'framer-motion'
import {
  Activity,
  Brain,
  ClipboardList,
  FileVideo,
  MessageCircleHeart,
  PencilLine,
  Plus,
  Stethoscope,
  Trash2,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminDoctorInbox from './AdminDoctorInbox'
import AdminPsychologistPanel from './AdminPsychologistPanel'
import AdminRegisteredStudents from './AdminRegisteredStudents'
import AdminTutorialVideosPanel from './AdminTutorialVideosPanel'
import { useTutorialManifest } from '../../hooks/useTutorialManifest'
import { useMedicalData } from '../../hooks/useMedicalData'
import { usePsychBookings } from '../../hooks/usePsychBookings'
import { usePsychGratitudeLogs } from '../../hooks/usePsychGratitudeLogs'
import { usePsychMoodLogs } from '../../hooks/usePsychMoodLogs'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import { pushNotification } from '../../lib/notificationsStorage'
import { uid } from '../../lib/uid'
import type { MedicalRecord, PERecord } from '../../types'

type AdminTab = 'pe' | 'psych' | 'medical'
type MedicalAdminPanel = 'records' | 'inbox'
type PeAdminPanel = 'records' | 'tutorials'

const tabMeta: {
  id: AdminTab
  label: string
  icon: typeof Activity
}[] = [
  { id: 'pe', label: 'Биеийн тамир', icon: Activity },
  { id: 'psych', label: 'Сэтгэл зүйч', icon: Brain },
  { id: 'medical', label: 'Эмчийн бүртгэл', icon: Stethoscope },
]

const MEDICAL_RECORD_TYPE_OPTIONS = [
  'Жилийн үзлэг',
  'Жилийн эрүүл мэндийн үзлэг',
  'Шүдний үзлэг',
  'Шүдний урьдчилан сэргийлэх',
  'Ханиадны дагнах үзлэг',
  'Эрүүл мэндийн оношлогоо',
] as const

const MEDICAL_STATUS_OPTIONS = [
  'Хэвийн',
  'Эмчилгээ амжилттай',
  'Зөвлөмж өгөгдсөн',
  'Анхаарах',
  'Эмчийн хяналтад',
] as const

type MedicalAdminRecordFormState = {
  studentId: string
  studentQuery: string
  recordType: string
  date: string
  status: string
  summary: string
  alert: string
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('pe')
  const [pePanel, setPePanel] = useState<PeAdminPanel>('records')
  const [medicalPanel, setMedicalPanel] = useState<MedicalAdminPanel>('records')
  const tutorialManifest = useTutorialManifest()
  const {
    records: medicalRows,
    upsertMedicalRecord,
    deleteMedicalRecord,
    addHealthAlert,
    upsertHealthProfile,
  } = useMedicalData()
  const { students: registryStudents } = useStudentRegistry()
  const [peRows, setPeRows] = useState<PERecord[]>([])
  const psychBookings = usePsychBookings()
  const psychMoodLogs = usePsychMoodLogs()
  const psychGratitudeLogs = usePsychGratitudeLogs()

  const [peForm, setPeForm] = useState({
    studentName: '',
    date: '',
    activity: '',
    score: '',
  })
  const [medicalForm, setMedicalForm] =
    useState<MedicalAdminRecordFormState>({
      studentId: '',
      studentQuery: '',
      recordType:
        (MEDICAL_RECORD_TYPE_OPTIONS[1] ??
          MEDICAL_RECORD_TYPE_OPTIONS[0]) ||
        '',
      date: '',
      status:
        (MEDICAL_STATUS_OPTIONS[0] ?? MEDICAL_STATUS_OPTIONS[0]) || '',
      summary: '',
      alert: '',
    })
  const [alertQuickForm, setAlertQuickForm] = useState<{
    studentId: string
    text: string
    level: 'warning' | 'info'
  }>({
    studentId: '',
    text: '',
    level: 'warning',
  })
  const [profileQuickForm, setProfileQuickForm] = useState({
    studentId: '',
    overallStatus: '',
    lastCheckup: '',
    pulse: '',
    pressure: '',
    vision: '',
  })

  const [editingPe, setEditingPe] = useState<PERecord | null>(null)
  const [editingMedical, setEditingMedical] = useState<MedicalRecord | null>(
    null,
  )

  const filteredStudentsForMedical = useMemo(() => {
    const q = medicalForm.studentQuery.trim().toLowerCase()
    if (!q) return registryStudents
    return registryStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    )
  }, [medicalForm.studentQuery, registryStudents])

  const tableCount = useMemo(() => {
    if (tab === 'pe') {
      return pePanel === 'tutorials'
        ? tutorialManifest.length
        : peRows.length
    }
    if (tab === 'psych') {
      return (
        psychBookings.bookings.length +
        psychMoodLogs.length +
        psychGratitudeLogs.length
      )
    }
    return medicalRows.length
  }, [
    tab,
    pePanel,
    peRows.length,
    psychBookings.bookings.length,
    psychMoodLogs.length,
    psychGratitudeLogs.length,
    medicalRows.length,
    tutorialManifest.length,
  ])

  function resetPeForm() {
    setPeForm({ studentName: '', date: '', activity: '', score: '' })
    setEditingPe(null)
  }
  function resetMedicalForm() {
    setMedicalForm({
      studentId: '',
      studentQuery: '',
      recordType:
        (MEDICAL_RECORD_TYPE_OPTIONS[1] ??
          MEDICAL_RECORD_TYPE_OPTIONS[0]) ||
        '',
      date: '',
      status:
        (MEDICAL_STATUS_OPTIONS[0] ?? MEDICAL_STATUS_OPTIONS[0]) || '',
      summary: '',
      alert: '',
    })
    setEditingMedical(null)
  }

  function onPeSubmit(e: FormEvent) {
    e.preventDefault()
    const score = Number(peForm.score)
    if (!peForm.studentName.trim() || !peForm.date || Number.isNaN(score)) {
      toast.error('Бүх талбарыг зөв бөглөнө үү')
      return
    }
    if (editingPe) {
      setPeRows((rows) =>
        rows.map((r) =>
          r.id === editingPe.id
            ? {
                ...r,
                studentName: peForm.studentName.trim(),
                date: peForm.date,
                activity: peForm.activity.trim(),
                score,
              }
            : r,
        ),
      )
      toast.success('Биеийн тамирын мэдээлэл шинэчлэгдлээ')
    } else {
      const row: PERecord = {
        id: uid('pe'),
        studentName: peForm.studentName.trim(),
        date: peForm.date,
        activity: peForm.activity.trim(),
        score,
      }
      setPeRows((rows) => [row, ...rows])
      toast.success('Шинэ биеийн тамирын бүртгэл нэмэгдлээ')
    }
    resetPeForm()
  }

  function onMedicalSubmit(e: FormEvent) {
    e.preventDefault()
    if (
      !medicalForm.studentId ||
      !medicalForm.recordType.trim() ||
      !medicalForm.date ||
      !medicalForm.status.trim()
    ) {
      toast.error('Сурагч, үзлэгийн төрөл, огноо, статусыг бөглөнө үү')
      return
    }
    const picked = registryStudents.find((s) => s.id === medicalForm.studentId)
    if (!picked) {
      toast.error('Сурагчийн бүртгэл олдсонгүй')
      return
    }
    upsertMedicalRecord({
      id: editingMedical?.id,
      studentId: medicalForm.studentId,
      studentName: picked.fullName,
      recordType: medicalForm.recordType.trim(),
      date: medicalForm.date,
      status: medicalForm.status.trim(),
      summary: medicalForm.summary.trim(),
      alert: medicalForm.alert.trim() || undefined,
    })
    toast.success(editingMedical ? 'Эмчийн бүртгэл шинэчлэгдлээ' : 'Шинэ үзлэг бүртгэгдлээ')
    resetMedicalForm()
  }

  function loadPeEdit(row: PERecord) {
    setEditingPe(row)
    setPeForm({
      studentName: row.studentName,
      date: row.date,
      activity: row.activity,
      score: String(row.score),
    })
  }
  function loadMedicalEdit(row: MedicalRecord) {
    setEditingMedical(row)
    setMedicalForm({
      studentId: row.studentId,
      studentQuery: '',
      recordType:
        row.recordType || MEDICAL_RECORD_TYPE_OPTIONS[0] || '',
      date: row.date,
      status: row.status,
      summary: row.summary,
      alert: row.alert ?? '',
    })
  }

  function onQuickAlertSubmit(e: FormEvent) {
    e.preventDefault()
    if (!alertQuickForm.studentId || !alertQuickForm.text.trim()) {
      toast.error('Сурагч болон текстээ оруулна уу')
      return
    }
    const alertText = alertQuickForm.text.trim()
    addHealthAlert({
      studentId: alertQuickForm.studentId,
      level: alertQuickForm.level,
      text: alertText,
    })
    pushNotification({
      type: 'medical',
      text: `Эмч шинэ эрүүл мэндийн анхааруулга нийтэллээ: ${alertText.slice(0, 72)}${alertText.length > 72 ? '…' : ''}`,
    })
    toast.success('Анхааруулга нэмэгдлээ')
    setAlertQuickForm((f) => ({ ...f, text: '' }))
  }

  function onQuickProfileSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profileQuickForm.studentId) {
      toast.error('Сурагч сонгоно уу')
      return
    }
    const hasPatch =
      profileQuickForm.overallStatus.trim() ||
      profileQuickForm.lastCheckup.trim() ||
      profileQuickForm.pulse.trim() ||
      profileQuickForm.pressure.trim() ||
      profileQuickForm.vision.trim()
    if (!hasPatch) {
      toast.message('Шинэчлэх талбаруудыг бөглөнө үү')
      return
    }
    const patch: Partial<{
      overallStatus: string
      lastCheckup: string
      vitals: {
        pulse: string
        pressure: string
        vision: string
      }
    }> = {}
    if (profileQuickForm.overallStatus.trim()) {
      patch.overallStatus = profileQuickForm.overallStatus.trim()
    }
    if (profileQuickForm.lastCheckup.trim()) {
      patch.lastCheckup = profileQuickForm.lastCheckup.trim()
    }
    if (
      profileQuickForm.pulse.trim() ||
      profileQuickForm.pressure.trim() ||
      profileQuickForm.vision.trim()
    ) {
      patch.vitals = {
        pulse: profileQuickForm.pulse.trim() || '—',
        pressure: profileQuickForm.pressure.trim() || '—',
        vision: profileQuickForm.vision.trim() || '—',
      }
    }
    upsertHealthProfile(profileQuickForm.studentId, patch)
    toast.success('Эрүүл мэндийн тойм шинэчлэгдлээ')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700 dark:text-orange-300">
            Админ консоль
          </p>
        </div>
        <div className="rounded-2xl border border-orange-400/35 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-950 backdrop-blur-md dark:border-orange-400/25 dark:bg-orange-500/15 dark:text-orange-50">
          Идэвхтэй хэсэг:{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {tableCount}
          </span>{' '}
          мөр
        </div>
      </header>

      <AdminRegisteredStudents />

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/45 bg-white/60 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        {tabMeta.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                if (t.id !== 'medical') setMedicalPanel('records')
                if (t.id !== 'pe') setPePanel('records')
              }}
              className={`relative flex min-w-[160px] flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                active
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-orange-50/55 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-tab-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/45 via-white/65 to-emerald-400/35 dark:from-orange-500/35 dark:via-white/10 dark:to-emerald-500/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              )}
              <span className="relative flex size-10 items-center justify-center rounded-xl bg-white/85 shadow-sm dark:bg-black/35">
                <Icon className="size-5 text-orange-600 dark:text-orange-300" />
              </span>
              <span className="relative text-sm font-semibold">{t.label}</span>
            </button>
          )
        })}
      </div>

      {tab === 'pe' && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-orange-200/55 bg-orange-500/10 p-1 shadow-sm backdrop-blur-xl dark:border-orange-400/28 dark:bg-orange-950/45">
          <button
            type="button"
            onClick={() => setPePanel('records')}
            className={`relative flex min-w-[140px] flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition sm:min-w-[180px] ${
              pePanel === 'records'
                ? 'bg-white text-orange-950 shadow-md dark:bg-orange-900/70 dark:text-orange-50'
                : 'text-orange-900/80 hover:bg-white/60 dark:text-orange-100/65 dark:hover:bg-orange-900/35'
            }`}
          >
            <ClipboardList className="size-4 shrink-0 opacity-80" aria-hidden />
            Идэвхийн бүртгэл
          </button>
          <button
            type="button"
            onClick={() => setPePanel('tutorials')}
            className={`relative flex min-w-[140px] flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition sm:min-w-[200px] ${
              pePanel === 'tutorials'
                ? 'bg-white text-orange-950 shadow-md dark:bg-orange-900/70 dark:text-orange-50'
                : 'text-orange-900/80 hover:bg-white/60 dark:text-orange-100/65 dark:hover:bg-orange-900/35'
            }`}
          >
            <FileVideo className="size-4 shrink-0 opacity-80" aria-hidden />
            Дасгалын зааварчилгаа нэмэх
          </button>
        </div>
      )}

      {tab === 'medical' && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-emerald-200/55 bg-[#E8F5E9]/45 p-1 shadow-sm backdrop-blur-xl dark:border-emerald-500/25 dark:bg-emerald-950/35">
          <button
            type="button"
            onClick={() => setMedicalPanel('records')}
            className={`relative flex min-w-[140px] flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition sm:min-w-[180px] ${
              medicalPanel === 'records'
                ? 'bg-white text-emerald-950 shadow-md dark:bg-emerald-900/70 dark:text-emerald-50'
                : 'text-emerald-900/75 hover:bg-white/60 dark:text-emerald-100/65 dark:hover:bg-emerald-900/40'
            }`}
          >
            <ClipboardList className="size-4 shrink-0 opacity-80" aria-hidden />
            Сурагчийн эрүүл мэнд удирдах
          </button>
          <button
            type="button"
            onClick={() => setMedicalPanel('inbox')}
            className={`relative flex min-w-[140px] flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition sm:min-w-[180px] ${
              medicalPanel === 'inbox'
                ? 'bg-white text-emerald-950 shadow-md dark:bg-emerald-900/70 dark:text-emerald-50'
                : 'text-emerald-900/75 hover:bg-white/60 dark:text-emerald-100/65 dark:hover:bg-emerald-900/40'
            }`}
          >
            <MessageCircleHeart
              className="size-4 shrink-0 opacity-80"
              aria-hidden
            />
            Ирсэн асуултууд
          </button>
        </div>
      )}

      <motion.div
        key={
          tab === 'medical'
            ? `${tab}-${medicalPanel}`
            : tab === 'pe'
              ? `${tab}-${pePanel}`
              : tab
        }
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26 }}
        className={
          tab === 'medical' && medicalPanel === 'records'
            ? 'flex flex-col gap-6'
            : `grid gap-6 ${
                tab === 'medical' && medicalPanel === 'inbox'
                  ? ''
                  : tab === 'pe' && pePanel === 'tutorials'
                    ? ''
                    : 'xl:grid-cols-[minmax(0,340px)_1fr]'
              }`
        }
      >
        {tab === 'pe' && pePanel === 'records' && (
          <>
            <form
              onSubmit={onPeSubmit}
              className="h-fit space-y-3 rounded-3xl border border-white/55 bg-white/75 p-5 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {editingPe ? 'Засварлах' : 'Шинэ бүртгэл'}
                </p>
                {editingPe && (
                  <button
                    type="button"
                    onClick={resetPeForm}
                    className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-200"
                  >
                    Цуцлах
                  </button>
                )}
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                  Сурагчийн нэр
                </span>
                <input
                  required
                  value={peForm.studentName}
                  onChange={(e) =>
                    setPeForm((f) => ({ ...f, studentName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none ring-orange-400/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                  Огноо
                </span>
                <input
                  required
                  type="date"
                  value={peForm.date}
                  onChange={(e) =>
                    setPeForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                  Идэвх / шалгалт
                </span>
                <input
                  required
                  value={peForm.activity}
                  onChange={(e) =>
                    setPeForm((f) => ({ ...f, activity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  placeholder="Жишээ: Уртын гүйлт"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                  Оноо
                </span>
                <input
                  required
                  type="number"
                  min={0}
                  max={100}
                  value={peForm.score}
                  onChange={(e) =>
                    setPeForm((f) => ({ ...f, score: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/25"
              >
                <Plus className="size-4" />
                {editingPe ? 'Хадгалах' : 'Нэмэх'}
              </button>
            </form>

            <div className="overflow-hidden rounded-3xl border border-white/55 bg-white/70 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
              <div className="border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Хүснэгт — Биеийн тамир
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500 dark:bg-black/35 dark:text-orange-50/55">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Сурагч</th>
                      <th className="px-4 py-3 font-semibold">Огноо</th>
                      <th className="px-4 py-3 font-semibold">Идэвх</th>
                      <th className="px-4 py-3 font-semibold">Оноо</th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                    {peRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {row.studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-orange-50/70">
                          {row.date}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-orange-50/85">
                          {row.activity}
                        </td>
                        <td className="px-4 py-3 font-semibold text-orange-700 dark:text-orange-300">
                          {row.score}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => loadPeEdit(row)}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-black/35 dark:text-orange-50 dark:hover:bg-black/45"
                              aria-label="Засварлах"
                            >
                              <PencilLine className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPeRows((rows) =>
                                  rows.filter((r) => r.id !== row.id),
                                )
                                toast.success('Мөр устгагдлаа')
                              }}
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/55"
                              aria-label="Устгах"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'pe' && pePanel === 'tutorials' && (
          <div className="xl:col-span-2">
            <AdminTutorialVideosPanel />
          </div>
        )}

        {tab === 'psych' && <AdminPsychologistPanel />}


        {tab === 'medical' && medicalPanel === 'inbox' && <AdminDoctorInbox />}

        {tab === 'medical' && medicalPanel === 'records' && (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                onSubmit={onMedicalSubmit}
                className="h-fit space-y-3 rounded-3xl border border-white/55 bg-white/75 p-5 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Үзлэгийн бүртгэл
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-orange-50/60">
                    {editingMedical
                      ? 'Сонгосон мөрийг засварлана'
                      : 'Бүртгэлтэй сурагчидыг ID / нэрээрээ сонгоно'}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <p className="mr-auto text-xs font-medium text-emerald-800 dark:text-emerald-100">
                    {editingMedical ? 'Засварлах' : 'Шинэ бүртгэл'}
                  </p>
                  {editingMedical && (
                    <button
                      type="button"
                      onClick={resetMedicalForm}
                      className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline dark:text-orange-200"
                    >
                      Цуцлах
                    </button>
                  )}
                </div>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Сурагч хайх (нэр · имэйл · ID)
                  </span>
                  <input
                    value={medicalForm.studentQuery}
                    onChange={(e) =>
                      setMedicalForm((f) => ({
                        ...f,
                        studentQuery: e.target.value,
                      }))
                    }
                    placeholder="Сурагчийн нэр эсвэл и-мэйл"
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Сурагч сонгох
                  </span>
                  <select
                    required
                    value={medicalForm.studentId}
                    onChange={(e) =>
                      setMedicalForm((f) => ({
                        ...f,
                        studentId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  >
                    <option value="">— Сонгох —</option>
                    {filteredStudentsForMedical.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.classGroup}) · {s.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Үзлэгийн төрөл
                  </span>
                  <select
                    required
                    value={medicalForm.recordType}
                    onChange={(e) =>
                      setMedicalForm((f) => ({
                        ...f,
                        recordType: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  >
                    {MEDICAL_RECORD_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Огноо
                  </span>
                  <input
                    required
                    type="date"
                    value={medicalForm.date}
                    onChange={(e) =>
                      setMedicalForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Статус
                  </span>
                  <select
                    required
                    value={medicalForm.status}
                    onChange={(e) =>
                      setMedicalForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  >
                    {MEDICAL_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Дэлгэрэнгүй / тайлбар
                  </span>
                  <textarea
                    rows={3}
                    value={medicalForm.summary}
                    onChange={(e) =>
                      setMedicalForm((f) => ({
                        ...f,
                        summary: e.target.value,
                      }))
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                    placeholder="Онош, зөвлөмж, дараагийн үйлдэл…"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-orange-50/65">
                    Мөрийн анхааруулга (сонголттой)
                  </span>
                  <input
                    value={medicalForm.alert}
                    onChange={(e) =>
                      setMedicalForm((f) => ({ ...f, alert: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
                  />
                </label>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
                >
                  <Plus className="size-4" />
                  {editingMedical ? 'Хадгалах' : 'Нэмэх'}
                </button>
              </form>

              <div className="flex flex-col gap-6">
                <form
                  onSubmit={onQuickAlertSubmit}
                  className="space-y-3 rounded-3xl border border-orange-400/35 bg-orange-500/12 p-5 shadow-inner backdrop-blur-xl dark:bg-orange-500/15"
                >
                  <p className="text-sm font-semibold text-orange-950 dark:text-orange-50">
                    Шуурхай: Анхааруулгын текст
                  </p>
                  <p className="text-[11px] text-orange-900/85 dark:text-orange-100/70">
                    Жишээ: дараагийн вакцины огноог шинэчлэн оруулахад тустай.
                  </p>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-orange-950/85 dark:text-orange-50/80">
                      Сурагч
                    </span>
                    <select
                      required
                      value={alertQuickForm.studentId}
                      onChange={(e) =>
                        setAlertQuickForm((f) => ({
                          ...f,
                          studentId: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-orange-200/70 bg-white/90 px-3 py-2 text-sm outline-none dark:border-white/15 dark:bg-black/35 dark:text-white"
                    >
                      <option value="">— Сонгох —</option>
                      {registryStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-orange-950/85 dark:text-orange-50/80">
                      Түлхүүр (анхааруулга / мэдээлэл)
                    </span>
                    <select
                      value={alertQuickForm.level}
                      onChange={(e) =>
                        setAlertQuickForm((f) => ({
                          ...f,
                          level: e.target.value === 'info' ? 'info' : 'warning',
                        }))
                      }
                      className="w-full rounded-xl border border-orange-200/70 bg-white/90 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/35 dark:text-white"
                    >
                      <option value="warning">Анхааруулга</option>
                      <option value="info">Мэдээлэл</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-orange-950/85 dark:text-orange-50/80">
                      Текст
                    </span>
                    <textarea
                      rows={2}
                      required
                      value={alertQuickForm.text}
                      onChange={(e) =>
                        setAlertQuickForm((f) => ({
                          ...f,
                          text: e.target.value,
                        }))
                      }
                      placeholder="Дараагийн вакцины хугацаа: 2026-08-01"
                      className="w-full resize-y rounded-xl border border-orange-200/70 bg-white/90 px-3 py-2 text-sm outline-none dark:border-white/15 dark:bg-black/35 dark:text-white"
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-105"
                  >
                    Анхааруулга хадгалах
                  </button>
                </form>

                <form
                  onSubmit={onQuickProfileSubmit}
                  className="space-y-3 rounded-3xl border border-emerald-400/35 bg-emerald-500/10 p-5 backdrop-blur-xl dark:bg-emerald-500/14"
                >
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                    Ерөнхий төлөв & үзүүлэлтүүд
                  </p>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-emerald-900/85 dark:text-emerald-50/80">
                      Сурагч
                    </span>
                    <select
                      required
                      value={profileQuickForm.studentId}
                      onChange={(e) =>
                        setProfileQuickForm((f) => ({
                          ...f,
                          studentId: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-sm outline-none dark:border-white/15 dark:bg-black/35 dark:text-white"
                    >
                      <option value="">— Сонгох —</option>
                      {registryStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-emerald-900/85 dark:text-emerald-50/80">
                      Ерөнхий статусын тайлбар
                    </span>
                    <input
                      value={profileQuickForm.overallStatus}
                      onChange={(e) =>
                        setProfileQuickForm((f) => ({
                          ...f,
                          overallStatus: e.target.value,
                        }))
                      }
                      placeholder="Сайн — хяналтын түвшинд"
                      className="w-full rounded-xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/35 dark:text-white"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-emerald-900/85 dark:text-emerald-50/80">
                      Сүүлийн үзлэг (огноо)
                    </span>
                    <input
                      type="date"
                      value={profileQuickForm.lastCheckup}
                      onChange={(e) =>
                        setProfileQuickForm((f) => ({
                          ...f,
                          lastCheckup: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-sm dark:border-white/15 dark:bg-black/35 dark:text-white"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block space-y-1 sm:col-span-1">
                      <span className="text-[11px] font-medium text-emerald-900/85 dark:text-emerald-50/80">
                        Импульс
                      </span>
                      <input
                        value={profileQuickForm.pulse}
                        onChange={(e) =>
                          setProfileQuickForm((f) => ({
                            ...f,
                            pulse: e.target.value,
                          }))
                        }
                        placeholder="72 / мин"
                        className="w-full rounded-lg border border-emerald-200/70 bg-white/90 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-black/35 dark:text-white"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium text-emerald-900/85 dark:text-emerald-50/80">
                        Даралт
                      </span>
                      <input
                        value={profileQuickForm.pressure}
                        onChange={(e) =>
                          setProfileQuickForm((f) => ({
                            ...f,
                            pressure: e.target.value,
                          }))
                        }
                        placeholder="112/74 mmHg"
                        className="w-full rounded-lg border border-emerald-200/70 bg-white/90 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-black/35 dark:text-white"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium text-emerald-900/85 dark:text-emerald-50/80">
                        Хараа
                      </span>
                      <input
                        value={profileQuickForm.vision}
                        onChange={(e) =>
                          setProfileQuickForm((f) => ({
                            ...f,
                            vision: e.target.value,
                          }))
                        }
                        placeholder="Үзлэг хэвийн"
                        className="w-full rounded-lg border border-emerald-200/70 bg-white/90 px-2 py-1.5 text-xs dark:border-white/15 dark:bg-black/35 dark:text-white"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md"
                  >
                    Профайл хадгалах
                  </button>
                </form>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/55 bg-white/70 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
              <div className="border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Хүснэгт — Бүх сурагчийн үзлэг
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500 dark:bg-black/35 dark:text-orange-50/55">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Сурагч</th>
                      <th className="px-4 py-3 font-semibold">Төрөл</th>
                      <th className="px-4 py-3 font-semibold">Огноо</th>
                      <th className="px-4 py-3 font-semibold">Статус</th>
                      <th className="px-4 py-3 font-semibold">Тайлбар</th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                    {medicalRows.map((row) => (
                      <tr key={row.id}>
                        <td className="min-w-0 px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <span className="block max-w-[180px] break-words">
                            {row.studentName}
                          </span>
                          <span className="mt-1 block truncate text-[10px] uppercase tracking-wide text-slate-400 dark:text-orange-50/45">
                            {row.studentId}
                          </span>
                        </td>
                        <td className="max-w-[160px] min-w-0 px-4 py-3 text-slate-700 dark:text-orange-50/85">
                          <span className="line-clamp-3 break-words">
                            {row.recordType}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-orange-50/70">
                          {row.date}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] dark:bg-emerald-500/22">
                            {row.status}
                          </span>
                        </td>
                        <td className="max-w-[260px] min-w-[120px] px-4 py-3 text-slate-700 dark:text-orange-50/80">
                          <div className="break-words text-[13px] leading-snug">
                            {row.summary}
                          </div>
                          {row.alert && (
                            <div className="mt-2 rounded-lg bg-orange-500/15 px-2 py-1 text-[11px] font-semibold text-orange-900 dark:text-orange-100">
                              {row.alert}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => loadMedicalEdit(row)}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-black/35 dark:text-orange-50 dark:hover:bg-black/45"
                              aria-label="Засварлах"
                            >
                              <PencilLine className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                deleteMedicalRecord(row.id)
                                toast.success('Мөр устгагдлаа')
                              }}
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/55"
                              aria-label="Устгах"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
