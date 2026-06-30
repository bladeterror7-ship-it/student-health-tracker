import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  Dumbbell,
  Film,
  Link2,
  Play,
  Plus,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { uid } from '../../lib/uid'
import { APP_STORAGE_SYNCED_EVENT } from '../../lib/storageSyncEvents'
import { StudentPeTeacherTutorials } from './StudentPeTeacherTutorials'
import {
  deleteVideoBlob,
  getVideoBlob,
  openPeVideoDb,
  peGalleryStorageKey,
  PE_VIDEO_PENDING_KEY,
  saveVideoBlob,
} from '../../lib/peVideoDb'

const LS_ACTIVITIES_KEY = 'pe-student-pe-activities-v1'
const LS_GALLERY_KEY = 'pe-pe-gallery-videos-v1'

const KCAL_PER_MIN = 8
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const ACTIVITY_OPTIONS = [
  'Сагсан бөмбөг',
  'Волейбол',
  'Гүйлт + Сунгалт',
  'Хөлбөмбөг',
  'Гимнастик',
] as const

type GoalRow = {
  label: string
  current: number
  target: number
  unit: string
}

type ActivityRow = {
  id: string
  date: string
  type: string
  duration: string
  calories: number
  /** Runtime-only object URL */
  videoUrl?: string | null
  /** IndexedDB blob key */
  videoStorageKey?: string | null
}

/** Persisted gallery row (no runtime URL). */
type PersistedGalleryVideo = {
  id: string
  storageKey: string
  fileName: string
  createdAt: string
}

type GalleryVideoItem = PersistedGalleryVideo & {
  videoUrl: string | null
}

type UploadPhase = 'idle' | 'uploading'

function loadPersistedActivities(): ActivityRow[] {
  try {
    const raw = localStorage.getItem(LS_ACTIVITIES_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as Array<
      Omit<ActivityRow, 'videoUrl'> & { videoStorageKey?: string | null }
    >
    if (!Array.isArray(data)) return []
    return data
      .filter((row) => !String(row.id ?? '').startsWith('seed_'))
      .map((row) => ({
        ...row,
        videoUrl: null,
        videoStorageKey: row.videoStorageKey ?? null,
      }))
  } catch {
    return []
  }
}

function loadPersistedGalleryManifest(): PersistedGalleryVideo[] {
  try {
    const raw = localStorage.getItem(LS_GALLERY_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as PersistedGalleryVideo[]
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

function validateVideoFile(file: File): string | null {
  const lower = file.name.toLowerCase()
  const hasExt =
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.avi')
  const mimeOk =
    /^video\/(mp4|quicktime|x-msvideo)$/i.test(file.type) ||
    (file.type === '' && hasExt)
  if (!hasExt) {
    return 'Зөвхөн mp4, mov, avi өргөтгөлтэй видео сонгоно уу.'
  }
  if (!mimeOk && file.type !== '') {
    return 'Файлын төрөл зөвшөөрөгдөхгүй байна (mp4, mov, avi).'
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return 'Файлын хэмжээ 50MB-аас их байж болохгүй.'
  }
  return null
}

function formatGalleryDate(iso: string): string {
  try {
    return iso.slice(0, 10)
  } catch {
    return iso
  }
}

export default function StudentPeActivitySection() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadIntervalRef = useRef<number>(0)
  const blobUrlsRef = useRef(new Set<string>())

  const registerBlobUrl = useCallback((url: string) => {
    blobUrlsRef.current.add(url)
  }, [])

  const revokeBlobUrl = useCallback((url: string | null | undefined) => {
    if (!url) return
    blobUrlsRef.current.delete(url)
    URL.revokeObjectURL(url)
  }, [])

  const [goals, setGoals] = useState<GoalRow[]>([])

  const [activities, setActivities] =
    useState<ActivityRow[]>(loadPersistedActivities)
  const activitiesRef = useRef<ActivityRow[]>(activities)

  useEffect(() => {
    activitiesRef.current = activities
  }, [activities])

  const [uploadedVideos, setUploadedVideos] = useState<GalleryVideoItem[]>(
    () =>
      loadPersistedGalleryManifest().map((v) => ({
        ...v,
        videoUrl: null,
      })),
  )

  const [linkVideoId, setLinkVideoId] = useState<string | null>(null)

  const [activityType, setActivityType] = useState<string>(ACTIVITY_OPTIONS[0])
  const [minutes, setMinutes] = useState('')
  const [calories, setCalories] = useState('')

  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSrc, setModalSrc] = useState<string | null>(null)

  const minutesNum = useMemo(() => {
    const n = Number(minutes)
    return Number.isFinite(n) ? n : 0
  }, [minutes])

  const linkedVideoLabel = useMemo(() => {
    if (!linkVideoId) return null
    const v = uploadedVideos.find((x) => x.id === linkVideoId)
    if (!v) return null
    return `${formatGalleryDate(v.createdAt)} · ${v.fileName}`
  }, [linkVideoId, uploadedVideos])

  const clearUploadTimers = useCallback(() => {
    if (uploadIntervalRef.current) {
      window.clearInterval(uploadIntervalRef.current)
      uploadIntervalRef.current = 0
    }
  }, [])

  useEffect(() => {
    return () => {
      clearUploadTimers()
    }
  }, [clearUploadTimers])

  useEffect(() => {
    const reloadFromStorage = () => {
      setActivities(loadPersistedActivities())
      setUploadedVideos(
        loadPersistedGalleryManifest().map((v) => ({
          ...v,
          videoUrl: null,
        })),
      )
    }
    window.addEventListener(APP_STORAGE_SYNCED_EVENT, reloadFromStorage)
    return () =>
      window.removeEventListener(APP_STORAGE_SYNCED_EVENT, reloadFromStorage)
  }, [])

  useEffect(() => {
    try {
      const payload = activities.map((row) => {
        const { videoUrl: _runtimeUrl, ...persisted } = row
        void _runtimeUrl
        return persisted
      })
      localStorage.setItem(LS_ACTIVITIES_KEY, JSON.stringify(payload))
    } catch {
      // quota exceeded — ignore
    }
  }, [activities])

  useEffect(() => {
    try {
      const payload: PersistedGalleryVideo[] = uploadedVideos.map(
        ({ id, storageKey, fileName, createdAt }) => ({
          id,
          storageKey,
          fileName,
          createdAt,
        }),
      )
      localStorage.setItem(LS_GALLERY_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }, [uploadedVideos])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await openPeVideoDb()
      } catch {
        toast.error('IndexedDB ашиглах боломжгүй байна — бичлэг хадгалагдахгүй.')
        return
      }

      let manifest = [...loadPersistedGalleryManifest()]

      const pend = await getVideoBlob(PE_VIDEO_PENDING_KEY)
      if (pend && !cancelled) {
        const gid = uid('gv')
        const sk = peGalleryStorageKey(gid)
        try {
          await saveVideoBlob(sk, pend.blob, pend.fileName)
          await deleteVideoBlob(PE_VIDEO_PENDING_KEY)
          manifest = [
            {
              id: gid,
              storageKey: sk,
              fileName: pend.fileName,
              createdAt: new Date().toISOString(),
            },
            ...manifest,
          ]
          localStorage.setItem(LS_GALLERY_KEY, JSON.stringify(manifest))
        } catch {
          /* ignore migration failure */
        }
      }

      const galleryHydrated: GalleryVideoItem[] = []
      for (const row of manifest) {
        if (!row.storageKey) continue
        const rec = await getVideoBlob(row.storageKey)
        if (!rec || cancelled) {
          galleryHydrated.push({ ...row, videoUrl: null })
          continue
        }
        const url = URL.createObjectURL(rec.blob)
        registerBlobUrl(url)
        galleryHydrated.push({ ...row, videoUrl: url })
      }

      if (cancelled) {
        galleryHydrated.forEach((r) => revokeBlobUrl(r.videoUrl))
        return
      }

      setUploadedVideos((live) => {
        const seen = new Set<string>()
        const ordered: GalleryVideoItem[] = []
        for (const h of galleryHydrated) {
          ordered.push(h)
          seen.add(h.id)
        }
        for (const item of live) {
          if (!seen.has(item.id)) ordered.push(item)
        }
        return ordered
      })

      const snapshot = [...activitiesRef.current]

      const hydratedRows: ActivityRow[] = []
      for (const row of snapshot) {
        if (!row.videoStorageKey) {
          hydratedRows.push({ ...row, videoUrl: null })
          continue
        }
        const rec = await getVideoBlob(row.videoStorageKey)
        if (!rec || cancelled) {
          hydratedRows.push({ ...row, videoStorageKey: null, videoUrl: null })
          continue
        }
        const url = URL.createObjectURL(rec.blob)
        registerBlobUrl(url)
        hydratedRows.push({ ...row, videoUrl: url })
      }

      if (cancelled) {
        hydratedRows.forEach((r) => revokeBlobUrl(r.videoUrl))
        return
      }

      setActivities((live) => {
        const hydratedById = new Map(hydratedRows.map((r) => [r.id, r]))
        return live.map((row) => hydratedById.get(row.id) ?? row)
      })
    })()

    return () => {
      cancelled = true
    }
  }, [registerBlobUrl, revokeBlobUrl])

  useEffect(() => {
    const tracked = blobUrlsRef.current
    return () => {
      tracked.forEach((u) => URL.revokeObjectURL(u))
      tracked.clear()
    }
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  function handleMinutesChange(value: string) {
    setMinutes(value)
    if (value === '') {
      setCalories('')
      return
    }
    const n = Number(value)
    if (Number.isFinite(n) && n >= 0) {
      setCalories(String(Math.max(0, Math.round(n * KCAL_PER_MIN))))
    }
  }

  const removeGalleryVideo = useCallback(
    async (id: string) => {
      const item = uploadedVideos.find((v) => v.id === id)
      if (!item) return
      try {
        await deleteVideoBlob(item.storageKey)
      } catch {
        /* ignore */
      }
      revokeBlobUrl(item.videoUrl)
      setUploadedVideos((prev) => prev.filter((v) => v.id !== id))
      setLinkVideoId((prev) => (prev === id ? null : prev))
      setActivities((prev) =>
        prev.map((row) =>
          row.videoStorageKey === item.storageKey
            ? { ...row, videoStorageKey: null, videoUrl: null }
            : row,
        ),
      )
      toast.message('Бичлэг устгагдлаа')
    },
    [revokeBlobUrl, uploadedVideos],
  )

  function startUploadSimulation(file: File) {
    setVideoError(null)
    clearUploadTimers()
    setUploadPhase('uploading')
    setUploadProgress(0)

    uploadIntervalRef.current = window.setInterval(() => {
      setUploadProgress((p) => {
        const next = Math.min(100, p + Math.random() * 14 + 5)
        if (next >= 100) {
          window.clearInterval(uploadIntervalRef.current)
          uploadIntervalRef.current = 0

          void (async () => {
            try {
              const gid = uid('gv')
              const storageKey = peGalleryStorageKey(gid)
              await saveVideoBlob(storageKey, file, file.name)
              const url = URL.createObjectURL(file)
              registerBlobUrl(url)
              const entry: GalleryVideoItem = {
                id: gid,
                storageKey,
                fileName: file.name,
                createdAt: new Date().toISOString(),
                videoUrl: url,
              }
              setUploadedVideos((prev) => [entry, ...prev])
              setUploadPhase('idle')
              setUploadProgress(0)
              toast.success('Бичлэг нэмэгдлээ', {
                description: 'Gallery болон IndexedDB-д хадгалагдлаа.',
              })
            } catch {
              toast.error(
                'Бичлэгийг хадгалахад алдаа гарлаа (IndexedDB эсвэл диск бүрэн дүүрсэн байж болно).',
              )
              setUploadPhase('idle')
              setUploadProgress(0)
            }
          })()

          return 100
        }
        return next
      })
    }, 85)
  }

  function processFile(file: File | undefined) {
    if (!file) return
    if (uploadPhase === 'uploading') {
      toast.message('Одоогийн бичлэг дуусахыг хүлээнэ үү')
      return
    }
    const err = validateVideoFile(file)
    if (err) {
      setVideoError(err)
      toast.error(err)
      return
    }
    setVideoError(null)
    startUploadSimulation(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    processFile(e.dataTransfer.files?.[0])
  }

  function openLightbox(src: string | null | undefined) {
    if (!src) return
    setModalSrc(src)
    setModalOpen(true)
  }

  function toggleLinkVideo(id: string) {
    setLinkVideoId((prev) => (prev === id ? null : id))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const mRound = Math.round(minutesNum)
    if (!mRound || mRound <= 0) {
      toast.error('Хугацааг минутаар зөв оруулна уу')
      return
    }

    const calVal =
      calories.trim() === ''
        ? Math.round(mRound * KCAL_PER_MIN)
        : Number(calories)
    if (!Number.isFinite(calVal) || calVal < 0) {
      toast.error('Идэвх (ккал)-ыг шалгана уу')
      return
    }

    if (uploadPhase === 'uploading') {
      toast.error('Бичлэг байршуулаагүй байна — түр хүлээнэ үү')
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const rowId = uid('pe')

    let videoUrl: string | null = null
    let videoStorageKey: string | null = null

    if (linkVideoId) {
      const g = uploadedVideos.find((v) => v.id === linkVideoId)
      if (g?.videoUrl && g.storageKey) {
        videoStorageKey = g.storageKey
        videoUrl = g.videoUrl
      }
    }

    const row: ActivityRow = {
      id: rowId,
      date: today,
      type: activityType,
      duration: `${mRound} мин`,
      calories: Math.round(calVal),
      videoUrl,
      videoStorageKey,
    }

    setActivities((prev) => [row, ...prev])

    setGoals((prev) =>
      prev.map((g, i) => {
        if (i === 0) {
          const contrib = Math.min(1, mRound / 45)
          const next = Math.min(
            g.target,
            Math.round((g.current + contrib) * 100) / 100,
          )
          return { ...g, current: next }
        }
        if (i === 1) {
          const next = Math.min(
            g.target,
            Math.round(g.current + mRound * 14),
          )
          return { ...g, current: next }
        }
        return g
      }),
    )

    toast.success('Идэвх бүртгэгдлээ', {
      description: `${activityType} · ${mRound} мин · ${Math.round(calVal)} ккал${videoUrl ? ' · видео холбосон' : ''}`,
    })
    setMinutes('')
    setCalories('')
    clearUploadTimers()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.length === 0 ? (
          <p className="col-span-full rounded-2xl border border-dashed border-emerald-400/35 bg-emerald-500/5 px-4 py-6 text-center text-sm text-slate-600 dark:text-emerald-100/60">
            Зорилго одоогоор тохируулаагүй байна. Идэвх бүртгэхэд энд
            харагдана.
          </p>
        ) : null}
        {goals.map((g) => {
          const pct = Math.min(
            100,
            Math.round((g.current / g.target) * 100),
          )
          return (
            <div
              key={g.label}
              className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 dark:bg-emerald-500/15"
            >
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                {g.label}
              </p>
              <p className="mt-1 text-xs text-emerald-900/75 dark:text-emerald-100/70">
                {g.current} / {g.target} {g.unit}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-black/35">
                <motion.div
                  key={`${g.label}-${g.current}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 140,
                    damping: 16,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-400"
                />
              </div>
              <p className="mt-2 text-right text-[11px] font-semibold text-emerald-900 dark:text-emerald-100">
                {pct}% биелэлт
              </p>
            </div>
          )
        })}
      </div>

      <StudentPeTeacherTutorials />

      <section className="rounded-2xl border border-emerald-400/25 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/18 dark:text-emerald-200">
            <Video className="size-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              Дасгалын бичлэг байршуулах
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-emerald-100/55">
              mp4, mov, avi · хамгийн ихдээ 50MB. Олон бичлэг хадгалагдана —
              картаас «Холбох» дарж идэвхтэй мөрт оруулна.
            </p>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ')
              fileInputRef.current?.click()
          }}
          onDragEnter={(ev) => {
            ev.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={(ev) => {
            ev.preventDefault()
            setDragActive(false)
          }}
          onDragOver={(ev) => {
            ev.preventDefault()
            setDragActive(true)
          }}
          onDrop={handleDrop}
          className={`relative flex min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragActive
              ? 'border-orange-400/65 bg-orange-500/15 shadow-inner dark:bg-orange-500/12'
              : 'border-emerald-400/45 bg-emerald-500/[0.07] hover:border-emerald-500/55 hover:bg-emerald-500/10 dark:border-emerald-400/25 dark:bg-emerald-950/25'
          }`}
          onClick={() =>
            uploadPhase !== 'uploading'
              ? fileInputRef.current?.click()
              : undefined
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
            className="sr-only"
            onChange={(ev) => processFile(ev.target.files?.[0])}
          />

          <UploadCloud
            className={`mb-3 size-11 ${uploadPhase === 'uploading' ? 'animate-pulse text-orange-500' : 'text-emerald-600 dark:text-emerald-300'}`}
            aria-hidden
          />
          <p className="max-w-xs text-sm font-medium text-slate-800 dark:text-emerald-50/95">
            Бичлэгээ энд чирж оруулна уу эсвэл сонгоно уу
          </p>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-emerald-100/50">
            Дэлгэцийг дарж файл сонгоно уу · олон файл нэмж болно
          </p>

          {uploadPhase === 'uploading' && (
            <div className="mt-5 w-full max-w-[240px] space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-emerald-900 dark:text-emerald-100">
                <span>Байршуулж байна...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-black/35">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ type: 'tween', duration: 0.12 }}
                />
              </div>
            </div>
          )}

          {videoError && uploadPhase === 'idle' && (
            <p className="mt-4 max-w-sm rounded-xl bg-red-500/15 px-3 py-2 text-xs font-medium text-red-900 dark:text-red-100">
              {videoError}
            </p>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Миний бичлэгүүд
            </h4>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-100">
              {uploadedVideos.length}
            </span>
          </div>

          {uploadedVideos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/35 bg-emerald-500/[0.06] px-6 py-12 text-center dark:border-emerald-500/20 dark:bg-emerald-950/20"
            >
              <Film className="mb-3 size-12 text-emerald-600/50 dark:text-emerald-300/45" />
              <p className="text-sm font-semibold text-slate-700 dark:text-emerald-100/80">
                Хоосон
              </p>
              <p className="mt-1 max-w-xs text-[11px] text-slate-500 dark:text-emerald-100/50">
                Энд бичлэг байршуулахад жагсаалт үүснэ — бүх файлууд утаснаасаа
                аялж бичигдэнэ.
              </p>
            </motion.div>
          ) : (
            <motion.ul
              layout
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {uploadedVideos.map((v) => (
                  <motion.li
                    key={v.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-white/85 shadow-sm backdrop-blur-md dark:bg-black/35 ${
                      linkVideoId === v.id
                        ? 'border-orange-400/70 ring-2 ring-orange-400/35'
                        : 'border-white/50 dark:border-white/10'
                    }`}
                  >
                    <div className="relative aspect-video bg-black/90">
                      {v.videoUrl ? (
                        <video
                          src={v.videoUrl}
                          muted
                          playsInline
                          className="size-full object-cover opacity-90"
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause()
                            e.currentTarget.currentTime = 0
                          }}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-emerald-100/35">
                          <Play className="size-10" />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100">
                        <Play className="size-12 text-white drop-shadow-md" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-emerald-50/95">
                        {v.fileName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-emerald-100/50">
                        {formatGalleryDate(v.createdAt)}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          disabled={!v.videoUrl}
                          onClick={() => openLightbox(v.videoUrl)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-400/45 bg-emerald-500/12 px-2 py-1.5 text-[11px] font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-100"
                        >
                          <Play className="size-3.5" />
                          Үзэх
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleLinkVideo(v.id)}
                          className={`inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-bold shadow-sm transition ${
                            linkVideoId === v.id
                              ? 'border-orange-400/55 bg-orange-500/20 text-orange-950 dark:text-orange-50'
                              : 'border-slate-200/80 bg-white text-slate-700 dark:border-white/10 dark:bg-black/45 dark:text-emerald-100'
                          }`}
                          title="Дараагийн идэвхтэй холбох"
                        >
                          <Link2 className="size-3.5" />
                          Холбох
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => void removeGalleryVideo(v.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200/90 bg-red-50 p-1.5 text-red-800 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-100"
                          aria-label="Устгах"
                        >
                          <Trash2 className="size-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
        <motion.section
          layout
          className="rounded-2xl border border-emerald-400/30 bg-white/85 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] sm:p-5 xl:col-span-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl border border-orange-400/35 bg-orange-500/12 text-orange-600 dark:border-orange-400/25 dark:bg-orange-500/15 dark:text-orange-300">
              <Dumbbell className="size-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Өнөөдрийн дасгал бүртгэх
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-100/55">
                Өнөөдрийн хичээл дээр хийсэн идэвхээ тэмдэглэнэ үү.
              </p>
            </div>
          </div>

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {linkedVideoLabel ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-400/35 bg-orange-500/10 px-3 py-2 text-[11px] dark:bg-orange-500/15">
                <span className="font-medium text-orange-950 dark:text-orange-50">
                  Холбох бичлэг: {linkedVideoLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setLinkVideoId(null)}
                  className="font-semibold text-orange-800 underline-offset-2 hover:underline dark:text-orange-200"
                >
                  Цуцлах
                </button>
              </div>
            ) : (
              <p className="rounded-xl border border-white/40 bg-white/50 px-3 py-2 text-[11px] text-slate-600 dark:border-white/10 dark:bg-black/25 dark:text-emerald-100/55">
                Дээд галерейгаас «Холбох» дарвал энэ идэвхтэй видео холбогдоно.
              </p>
            )}

            <label className="block text-left">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/50">
                Төрөл
              </span>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400/55 focus:ring-2 focus:ring-emerald-400/25 dark:border-white/10 dark:bg-black/35 dark:text-emerald-50"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/50">
                Хугацаа (мин)
              </span>
              <input
                type="number"
                min={1}
                max={240}
                value={minutes}
                onChange={(e) => handleMinutesChange(e.target.value)}
                placeholder="Жишээ нь: 40"
                className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400/55 focus:ring-2 focus:ring-emerald-400/25 dark:border-white/10 dark:bg-black/35 dark:text-emerald-50 dark:placeholder:text-emerald-100/35"
              />
            </label>

            <label className="block text-left">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/50">
                Идэвх (ккал)
              </span>
              <input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder={`≈ ${KCAL_PER_MIN} ккал / мин`}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400/45 focus:ring-2 focus:ring-orange-400/20 dark:border-white/10 dark:bg-black/35 dark:text-emerald-50 dark:placeholder:text-emerald-100/35"
              />
              <p className="mt-1 text-[10px] text-slate-400 dark:text-emerald-100/40">
                Хугацааны өөрчлөлтөөр автоматаар тооцогдоно — та өөрөө засварлаж болно.
              </p>
            </label>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              disabled={uploadPhase === 'uploading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-emerald-600 px-4 py-3 text-sm font-semibold tracking-tight text-white shadow-lg shadow-orange-900/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              Идэвх нэмэх
            </motion.button>
          </form>
        </motion.section>

        <section className="rounded-2xl border border-white/50 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-5 xl:col-span-7">
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Өдөр тутмын идэвхийн бүртгэл
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-100/90 dark:border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200/90 bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-black/30 dark:text-emerald-100/55">
                <tr>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Огноо</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Төрөл</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Хугацаа</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Идэвх</th>
                  <th className="px-3 py-2.5 font-semibold sm:px-4">Бичлэг</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                {activities.map((a) => (
                  <motion.tr
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/40 dark:bg-transparent"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-emerald-100/70 sm:px-4">
                      {a.date}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white sm:px-4">
                      {a.type}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-emerald-100/70 sm:px-4">
                      {a.duration}
                    </td>
                    <td className="px-3 py-2.5 text-orange-700 dark:text-orange-300 sm:px-4">
                      {a.calories} ккал
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      {a.videoUrl ? (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => openLightbox(a.videoUrl)}
                          className="inline-flex size-10 items-center justify-center rounded-xl border border-emerald-400/45 bg-emerald-500/15 text-emerald-800 shadow-sm transition hover:bg-emerald-500/25 dark:border-emerald-400/35 dark:bg-emerald-500/22 dark:text-emerald-100"
                          aria-label="Бичлэг үзэх"
                          title="Бичлэг үзэх"
                        >
                          <Camera className="size-5" />
                        </motion.button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-emerald-100/35">
                          —
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-orange-400/35 bg-orange-500/10 p-4 dark:bg-orange-500/15">
        <p className="mb-3 text-sm font-semibold text-orange-950 dark:text-orange-50">
          Одоогийн физикийн үнэлгээ
        </p>
        <p className="rounded-xl bg-white/80 px-3 py-4 text-sm text-slate-600 shadow-sm dark:bg-black/35 dark:text-emerald-100/60">
          Багш эсвэл админ үнэлгээ оруулахад энд харагдана.
        </p>
      </section>

      {modalOpen &&
        modalSrc &&
        createPortal(
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Бичлэг үзэх"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Бичлэг үзэх
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-black/40 dark:text-white dark:hover:bg-black/55"
                  aria-label="Хаах"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="bg-black p-3 sm:p-4">
                <video
                  key={modalSrc}
                  src={modalSrc}
                  controls
                  playsInline
                  className="mx-auto max-h-[min(70vh,520px)] w-full rounded-xl"
                />
              </div>
            </motion.div>
          </motion.div>,
          document.body,
        )}
    </>
  )
}
