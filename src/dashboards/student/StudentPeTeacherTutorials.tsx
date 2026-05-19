import { AnimatePresence, motion } from 'framer-motion'
import { Play, Sparkles, X } from 'lucide-react'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/useAuth'
import { useStudentRegistry } from '../../context/useStudentRegistry'
import { useTutorialManifest } from '../../hooks/useTutorialManifest'
import { getTutorialBlob } from '../../lib/teacherTutorialStorage'
import type { PeTutorialPublish } from '../../types'

/** Teacher PE tutorials filtered by student's registered class. */
export const StudentPeTeacherTutorials = memo(
  function StudentPeTeacherTutorials() {
    const { session } = useAuth()
    const { students } = useStudentRegistry()
    const manifest = useTutorialManifest()
    const [modalOpen, setModalOpen] = useState(false)
    const [activeMeta, setActiveMeta] = useState<PeTutorialPublish | null>(
      null,
    )
    const [activeUrl, setActiveUrl] = useState<string | null>(null)
    const revokedRef = useRef<string | null>(null)

    const registryMatch = useMemo(() => {
      if (!session) return undefined
      return students.find(
        (s) => s.email.toLowerCase() === session.email.toLowerCase(),
      )
    }, [students, session])

    const studentClass = registryMatch?.classGroup ?? null

    const filtered = useMemo(
      () =>
        studentClass
          ? manifest.filter((t) => t.classGroup === studentClass)
          : [],
      [manifest, studentClass],
    )

    const closeModal = useCallback(() => {
      setModalOpen(false)
      if (revokedRef.current) {
        URL.revokeObjectURL(revokedRef.current)
        revokedRef.current = null
      }
      setActiveUrl(null)
      setActiveMeta(null)
    }, [])

    const hydrate = useCallback(async (row: PeTutorialPublish) => {
      if (revokedRef.current) {
        URL.revokeObjectURL(revokedRef.current)
        revokedRef.current = null
      }
      setActiveMeta(row)
      setActiveUrl(null)
      setModalOpen(true)
      const blob = await getTutorialBlob(row.storageKey)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      revokedRef.current = url
      setActiveUrl(url)
    }, [])

    useEffect(() => {
      return () => {
        if (revokedRef.current) URL.revokeObjectURL(revokedRef.current)
      }
    }, [])

    useEffect(() => {
      if (!modalOpen) return
      function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape') closeModal()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [modalOpen, closeModal])

    return (
      <section className="rounded-2xl border border-emerald-400/25 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl border border-orange-400/35 bg-orange-500/14 text-orange-700 dark:border-orange-400/30 dark:text-orange-50">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              Багшийн зааварчилгаа бичлэгүүд
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/55">
              Зөвхөн таны бүртгэлтэй анги «{studentClass ?? '—'}»-д харгалзах
              материалыг үзүүлнэ.
            </p>
          </div>
        </div>

        {!studentClass ? (
          <p className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/14 dark:text-amber-50">
            Анги тодорхойгүй байна. Админд бүртгүүлсэн имэйлтэйгаа орсон эсэхээ
            шалгана уу — зааврууд ангиас шүүгдэнэ.
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-slate-600 dark:text-emerald-100/60">
            Одоогоор таны ангид нийтлэгдсэн зааварчилгаа алга.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row, i) => (
              <button
                key={row.id}
                type="button"
                className="group relative overflow-hidden rounded-2xl border border-orange-400/35 bg-orange-400/14 p-[1px] text-left shadow-sm transition hover:border-orange-300/65 hover:bg-orange-300/26 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 dark:bg-orange-500/22 dark:hover:bg-orange-500/38"
                onClick={() => void hydrate(row)}
              >
                <div className="relative flex h-full min-h-[140px] flex-col rounded-[15px] border border-orange-700/55 bg-orange-950/45 p-4 backdrop-blur-sm dark:bg-orange-950/35">
                  <span className="absolute right-3 top-3 rounded-full border border-orange-400/45 bg-orange-500/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-950">
                    {row.classGroup}
                  </span>
                  <div className="flex min-h-0 flex-1 flex-col pt-8">
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {row.title}
                    </p>
                    <p className="mt-2 line-clamp-3 flex-1 text-[11px] text-orange-100/75">
                      {row.description || 'Тайлбар байхгүй.'}
                    </p>
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45">
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      className="flex size-14 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white opacity-0 shadow-lg backdrop-blur-md transition group-hover:opacity-100"
                    >
                      <Play className="size-7 fill-current" aria-hidden />
                    </motion.span>
                  </div>
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/14 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      duration: 2.2,
                      delay: i * 0.12,
                      repeat: Infinity,
                      repeatDelay: 4,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {modalOpen && (
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Заавар тоглуулах"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/75 p-4 backdrop-blur-md"
                  onClick={closeModal}
                >
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.94, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 28,
                    }}
                    className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/18 bg-emerald-950/55 shadow-[0_25px_80px_rgba(15,118,110,0.32)] backdrop-blur-2xl"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-emerald-50">
                          {activeMeta?.title ?? 'Зааварчилгаа'}
                        </p>
                        {activeMeta?.description ? (
                          <p className="mt-1 line-clamp-2 text-[11px] text-emerald-100/70">
                            {activeMeta.description}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="shrink-0 rounded-xl border border-white/15 bg-white/10 p-2 text-emerald-50 transition hover:bg-white/20"
                        aria-label="Хаах"
                      >
                        <X className="size-5" aria-hidden />
                      </button>
                    </div>
                    <div className="bg-black p-3 sm:p-4">
                      {activeUrl ? (
                        <video
                          key={activeUrl}
                          src={activeUrl}
                          controls
                          playsInline
                          autoPlay
                          className="mx-auto aspect-video max-h-[min(70vh,520px)] w-full rounded-2xl"
                        >
                          Видео тоглуулагчаар дэмжигдэхгүй.
                        </video>
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl bg-black/85 p-8 text-emerald-100">
                          <p className="text-sm font-semibold">
                            Тоглуулахад бэлдэж байна…
                          </p>
                          <p className="max-w-md text-center text-[11px] opacity-75">
                            Бичлэг олдоогүй эсвэл IndexedDB-аас унших үед алдаа
                            гарсан байж болно.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )}
      </section>
    )
  },
)
