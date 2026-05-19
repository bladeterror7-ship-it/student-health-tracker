import { FileVideo, Trash2, UploadCloud } from 'lucide-react'
import type { DragEvent as ReactDragEvent } from 'react'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { STUDENT_CLASS_OPTIONS } from '../../types'
import { toast } from 'sonner'
import { pushNotification } from '../../lib/notificationsStorage'
import {
  deleteTutorial,
  publishTutorial,
  readTutorialManifest,
  TEACHER_TUTORIAL_EVENT,
} from '../../lib/teacherTutorialStorage'
import type { PeTutorialPublish } from '../../types'

const MAX_BYTES = 80 * 1024 * 1024

function validateMp4(file: File): string | null {
  const name = file.name.toLowerCase()
  if (!name.endsWith('.mp4')) {
    return 'Зөвхөн .mp4 файл сонгоно уу.'
  }
  if (file.size > MAX_BYTES) {
    return 'Файлын хэмжээ 80MB-аас бага байх ёстой.'
  }
  return null
}

/** Admin: PE tutorial uploads (persisted IndexedDB + localStorage manifest). */
export const AdminTutorialVideosPanel = memo(function AdminTutorialVideosPanel() {
  const [items, setItems] = useState<PeTutorialPublish[]>(() =>
    readTutorialManifest(),
  )
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classGroup, setClassGroup] = useState<string>(
    STUDENT_CLASS_OPTIONS[0] ?? '',
  )
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileErr, setFileErr] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function syncManifest() {
    setItems(readTutorialManifest())
  }

  useEffect(() => {
    const onEvt = () => syncManifest()
    window.addEventListener(TEACHER_TUTORIAL_EVENT, onEvt)
    window.addEventListener('storage', onEvt)
    return () => {
      window.removeEventListener(TEACHER_TUTORIAL_EVENT, onEvt)
      window.removeEventListener('storage', onEvt)
    }
  }, [])

  const assignFile = useCallback((f: File | undefined) => {
    if (!f) return
    const err = validateMp4(f)
    setFileErr(err)
    if (err) {
      setFile(null)
      toast.error(err)
      return
    }
    setFile(f)
  }, [])

  function onDrop(e: ReactDragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    assignFile(e.dataTransfer.files?.[0])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const d = description.trim()
    if (!t) {
      toast.error('Гарчигаа оруулна уу')
      return
    }
    if (!file) {
      toast.error('.mp4 бичлэг сонгоно уу')
      return
    }
    setPublishing(true)
    try {
      await publishTutorial({
        title: t,
        description: d,
        classGroup: classGroup || STUDENT_CLASS_OPTIONS[0],
        file,
      })
      setTitle('')
      setDescription('')
      setFile(null)
      setFileErr(null)
      if (inputRef.current) inputRef.current.value = ''
      syncManifest()
      pushNotification({
        type: 'video',
        text: `Багш шинэ дасгалын зааварчилгаа бичлэг орууллаа: «${t}»`,
      })
      toast.success('Зааварчилгаа нийтэллээ')
    } catch {
      toast.error('Хадгалахад алдаа гарлаа.')
    } finally {
      setPublishing(false)
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteTutorial(id)
      syncManifest()
      toast.message('Устгалаа')
    } catch {
      toast.error('Устгахад алдаа гарлаа')
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-slate-950/50 sm:p-5"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl border border-orange-400/35 bg-orange-500/14 text-orange-700 dark:border-orange-400/30 dark:text-orange-100">
            <FileVideo className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Дасгалын зааварчилгаа нэмэх
            </p>
            <p className="text-[11px] text-slate-600 dark:text-orange-50/70">
              Сурагчид зөвхөн өөрсдийн ангийн бичлэгийг харна.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-emerald-100/90">
              Гарчиг
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="11-р анги: Сагсан бөмбөгийн заалт"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/25 dark:border-white/12 dark:bg-black/35 dark:text-white dark:placeholder:text-emerald-100/45 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/25"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-emerald-100/90">
              Тайлбар
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Дасгалын агуулга, анхаарах зүйлс…"
              className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/25 dark:border-white/12 dark:bg-black/35 dark:text-white dark:placeholder:text-emerald-100/45 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/25"
            />
          </label>
          <label className="block sm:col-span-2 sm:max-w-xs">
            <span className="text-xs font-semibold text-slate-700 dark:text-emerald-100/90">
              Анги сонгох
            </span>
            <select
              value={classGroup}
              onChange={(e) => setClassGroup(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/25 dark:border-white/12 dark:bg-black/35 dark:text-white dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/25"
            >
              {STUDENT_CLASS_OPTIONS.map((c) => (
                <option
                  key={c}
                  value={c}
                  className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
                >
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragEnter={(ev) => {
            ev.preventDefault()
            setDrag(true)
          }}
          onDragOver={(ev) => {
            ev.preventDefault()
            setDrag(true)
          }}
          onDragLeave={(ev) => {
            ev.preventDefault()
            setDrag(false)
          }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={
            drag
              ? 'mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-400/80 bg-orange-50 px-4 py-8 text-center transition dark:border-orange-400/70 dark:bg-orange-500/15'
              : 'mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/90 px-4 py-8 text-center transition hover:border-orange-400/55 dark:border-white/25 dark:bg-white/[0.04] dark:hover:border-emerald-400/45'
          }
        >
          <UploadCloud
            className="size-8 text-orange-600 dark:text-emerald-200/95"
            aria-hidden
          />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            Видео чирж тавих эсвэл дарж сонгох
          </p>
          <p className="text-[11px] text-slate-600 dark:text-emerald-100/70">
            Зөвхөн MP4 · 80MB хүртэл
          </p>
          {file && (
            <p className="text-xs font-medium text-slate-800 dark:text-emerald-200">
              {file.name}
            </p>
          )}
          {fileErr && (
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              {fileErr}
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,video/mp4"
          className="hidden"
          onChange={(e) => assignFile(e.target.files?.[0])}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={publishing}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-50"
          >
            {publishing ? 'Нийтлэж байна…' : 'Нийтлэх'}
          </button>
        </div>
      </form>

      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 backdrop-blur-xl dark:border-white/15 dark:bg-white/[0.05]">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-emerald-100/75">
            Нийтлэгдсэн ({items.length})
          </p>
          <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3 dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {row.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-600 dark:text-emerald-100/70">
                    {row.description || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-orange-400/45 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-900 dark:border-orange-400/35 dark:bg-orange-500/20 dark:text-orange-50">
                      {row.classGroup}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void onDelete(row.id)}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-200 dark:hover:bg-red-500/25"
                  title="Устгах"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

export default AdminTutorialVideosPanel
