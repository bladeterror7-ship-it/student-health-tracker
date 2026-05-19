import { motion, AnimatePresence } from 'framer-motion'
import { PencilLine, Search, Trash2, Users } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import {
  STUDENT_CLASS_OPTIONS,
  type RegisteredStudent,
} from '../../types'

const TEAL = '#00BFA5'
const TEAL_HOVER = '#00a693'

export default function AdminRegisteredStudents() {
  const { students, updateStudent, deleteStudent } = useStudentRegistry()
  const [classFilter, setClassFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<RegisteredStudent | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (classFilter !== 'all' && s.classGroup !== classFilter) return false
      if (!q) return true
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    })
  }, [students, classFilter, query])

  function fmtDate(iso: string) {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return iso
    }
  }

  function handleDelete(row: RegisteredStudent) {
    if (
      !window.confirm(
        `${row.fullName} — устгахдаа итгэлтэй байна уу?`,
      )
    )
      return
    deleteStudent(row.id)
    if (editing?.id === row.id) setEditing(null)
    toast.success('Сурагчийн бүртгэл устгагдлаа')
  }

  function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    const fd = new FormData(e.currentTarget)
    const fullName = String(fd.get('fullName') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim().toLowerCase()
    const classGroup = String(fd.get('classGroup') ?? '').trim()
    const status = String(fd.get('status') ?? 'active') as
      | 'active'
      | 'inactive'
    if (!fullName || !email || !classGroup) {
      toast.error('Талбаруудыг бөглөнө үү')
      return
    }
    updateStudent(editing.id, { fullName, email, classGroup, status })
    setEditing(null)
    toast.success('Мэдээлэл шинэчлэгдлээ')
  }

  return (
    <section className="mb-8 rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-teal-400/35 bg-teal-500/15 text-teal-800 shadow-sm dark:border-teal-400/25 dark:bg-teal-500/15 dark:text-teal-100">
            <Users className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Бүртгэлтэй сурагчдын жагсаалт
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-orange-50/65">
              Нийт{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {students.length}
              </span>{' '}
              бүртгэл · Шүүлтээр{' '}
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {filtered.length}
              </span>
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="relative flex w-full items-center sm:w-52">
            <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Нэр эсвэл и-мэйл..."
              className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-2.5 pl-10 pr-3 text-sm outline-none ring-teal-500/0 transition focus:border-teal-500/45 focus:ring-2 focus:ring-teal-500/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
            />
          </label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2.5 text-sm font-medium outline-none focus:border-teal-500/45 focus:ring-2 focus:ring-teal-500/25 dark:border-white/10 dark:bg-black/35 dark:text-white sm:w-36"
          >
            <option value="all">Бүх анги</option>
            {STUDENT_CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.form
            key={editing.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={saveEdit}
            className="mb-5 overflow-hidden rounded-2xl border border-teal-400/35 bg-teal-500/10 p-4 dark:bg-teal-500/10"
          >
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              Засварлах — {editing.fullName}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Овог нэр
                </span>
                <input
                  name="fullName"
                  required
                  defaultValue={editing.fullName}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
              <label className="block text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Анги
                </span>
                <select
                  name="classGroup"
                  required
                  defaultValue={editing.classGroup}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/35 dark:text-white"
                >
                  {STUDENT_CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  И-мэйл
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editing.email}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
              <label className="block text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Төлөв
                </span>
                <select
                  name="status"
                  defaultValue={editing.status}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/35 dark:text-white"
                >
                  <option value="active">Идэвхтэй</option>
                  <option value="inactive">Идэвхгүй</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                style={{ backgroundColor: TEAL }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = TEAL_HOVER
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = TEAL
                }}
              >
                Хадгалах
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/15 dark:bg-black/35 dark:text-white"
              >
                Цуцлах
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200/90 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-black/40 dark:text-orange-50/55">
            <tr>
              <th className="px-4 py-3 font-semibold">Овог нэр</th>
              <th className="px-4 py-3 font-semibold">Анги</th>
              <th className="px-4 py-3 font-semibold">И-мэйл</th>
              <th className="px-4 py-3 font-semibold">Бүртгүүлсэн</th>
              <th className="px-4 py-3 font-semibold">Төлөв</th>
              <th className="px-4 py-3 font-semibold text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="bg-white/50 transition hover:bg-teal-500/[0.06] dark:bg-transparent dark:hover:bg-teal-500/10"
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {row.fullName}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-lg bg-teal-500/15 px-2 py-0.5 text-xs font-semibold text-teal-900 dark:bg-teal-500/20 dark:text-teal-100">
                    {row.classGroup}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-orange-50/75">
                  {row.email}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-orange-50/70">
                  {fmtDate(row.registeredAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      row.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                        : 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300'
                    }`}
                  >
                    {row.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-black/35 dark:text-orange-50 dark:hover:bg-black/45"
                      aria-label="Засах"
                    >
                      <PencilLine className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
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
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-orange-50/55">
            Илэрц алга — шүүлт эсвэл хайлтыг өөрчилнө үү.
          </p>
        )}
      </div>
    </section>
  )
}
