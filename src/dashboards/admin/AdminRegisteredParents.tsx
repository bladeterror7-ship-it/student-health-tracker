import { motion, AnimatePresence } from 'framer-motion'
import { HeartHandshake, KeyRound, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  fetchPortalAccountsFromApi,
  resetPortalPasswordInNeon,
  type PortalAccount,
} from '../../lib/neonPortal'

const VIOLET = '#7c3aed'
const VIOLET_HOVER = '#6d28d9'

export default function AdminRegisteredParents() {
  const [parents, setParents] = useState<PortalAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [passwordReset, setPasswordReset] = useState<PortalAccount | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const loadParents = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchPortalAccountsFromApi('parent')
      setParents(list)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Эцэг эхийн жагсаалт ачаалахад алдаа',
      )
      setParents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadParents()
  }, [loadParents])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return parents.filter((p) => {
      if (!q) return true
      const child = (p.linkedStudentName ?? p.linkedStudentId ?? '').toLowerCase()
      return (
        p.displayName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        child.includes(q)
      )
    })
  }, [parents, query])

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

  function openPasswordReset(row: PortalAccount) {
    setPasswordReset(row)
    setNewPassword('')
    setConfirmPassword('')
  }

  function closePasswordReset() {
    setPasswordReset(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handlePasswordReset(e: FormEvent) {
    e.preventDefault()
    if (!passwordReset) return
    const pwd = newPassword.trim()
    const confirm = confirmPassword.trim()
    if (pwd.length < 6) {
      toast.error('Нууц үг дор хаяж 6 тэмдэгт байх ёстой')
      return
    }
    if (pwd !== confirm) {
      toast.error('Нууц үг таарахгүй байна')
      return
    }
    setResetting(true)
    try {
      await resetPortalPasswordInNeon(passwordReset.id, pwd)
      toast.success('Нууц үг сэргээгдлээ', {
        description: `${passwordReset.displayName} — шинэ нууц үгийг эцэг эхэд өгнө үү.`,
      })
      closePasswordReset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Нууц үг сэргээхэд алдаа гарлаа',
      )
    } finally {
      setResetting(false)
    }
  }

  return (
    <section className="mb-8 rounded-3xl border border-white/50 bg-white/65 p-5 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/35 bg-violet-500/15 text-violet-800 shadow-sm dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-100">
            <HeartHandshake className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Бүртгэлтэй эцэг эхийн жагсаалт
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-orange-50/65">
              Нийт{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {parents.length}
              </span>{' '}
              бүртгэл · Шүүлтээр{' '}
              <span className="font-semibold text-violet-700 dark:text-violet-300">
                {filtered.length}
              </span>
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="relative flex w-full items-center sm:w-56">
            <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Нэр, и-мэйл, хүүхэд..."
              className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-2.5 pl-10 pr-3 text-sm outline-none ring-violet-500/0 transition focus:border-violet-500/45 focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-black/35 dark:text-white"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadParents()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-50 disabled:opacity-60 dark:border-violet-500/30 dark:bg-black/35 dark:text-violet-100 dark:hover:bg-violet-950/40"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Шинэчлэх
          </button>
        </div>
      </div>

      <AnimatePresence>
        {passwordReset && (
          <motion.form
            key={`pwd-parent-${passwordReset.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handlePasswordReset}
            className="mb-5 overflow-hidden rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 dark:bg-amber-500/10"
          >
            <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
              Нууц үг сэргээх — {passwordReset.displayName}
            </p>
            <p className="mb-3 text-xs text-slate-600 dark:text-orange-50/65">
              Зөвхөн нэвтрэх нууц үг солигдоно. Холбосон хүүхдийн мэдээлэл хадгалагдана.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Шинэ нууц үг
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
              <label className="block text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Давтах
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black/35 dark:text-white"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={resetting}
                style={{ backgroundColor: VIOLET }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = VIOLET_HOVER
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = VIOLET
                }}
              >
                {resetting ? 'Хадгалж байна…' : 'Нууц үг сэргээх'}
              </button>
              <button
                type="button"
                onClick={closePasswordReset}
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
              <th className="px-4 py-3 font-semibold">И-мэйл</th>
              <th className="px-4 py-3 font-semibold">Холбосон хүүхэд</th>
              <th className="px-4 py-3 font-semibold">Бүртгүүлсэн</th>
              <th className="px-4 py-3 font-semibold">Төлөв</th>
              <th className="px-4 py-3 font-semibold text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="bg-white/50 transition hover:bg-violet-500/[0.06] dark:bg-transparent dark:hover:bg-violet-500/10"
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {row.displayName}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-orange-50/75">
                  {row.email}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-orange-50/75">
                  {row.linkedStudentName ? (
                    <span>
                      {row.linkedStudentName}
                      {row.linkedStudentId && (
                        <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-orange-50/45">
                          {row.linkedStudentId}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-orange-50/45">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-orange-50/70">
                  {fmtDate(row.registeredAt)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      (row.status ?? 'active') === 'active'
                        ? 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                        : 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300'
                    }`}
                  >
                    {(row.status ?? 'active') === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openPasswordReset(row)}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/55"
                    aria-label="Нууц үг сэргээх"
                    title="Нууц үг сэргээх"
                  >
                    <KeyRound className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-orange-50/55">
            {parents.length === 0
              ? 'Эцэг эхийн бүртгэл алга. /login дээр эцэг эх бүртгүүлсний дараа «Шинэчлэх» дарна уу.'
              : 'Илэрц алга — хайлтаа өөрчилнө үү.'}
          </p>
        )}
        {loading && (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-orange-50/55">
            Ачаалж байна…
          </p>
        )}
      </div>
    </section>
  )
}
