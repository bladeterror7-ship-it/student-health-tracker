/** PE student workout videos — blob storage in IndexedDB (object URLs alone do not persist). */

const DB_NAME = 'pe-student-videos-v1'
const DB_VERSION = 1
const STORE = 'blobs'

export const PE_VIDEO_PENDING_KEY = 'pending' as const

export function peVideoRowStorageKey(rowId: string): string {
  return `video_${rowId}`
}

export function peGalleryStorageKey(galleryId: string): string {
  return `gallery_${galleryId}`
}

let dbPromise: Promise<IDBDatabase> | null = null

export function openPeVideoDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      dbPromise = null
      reject(new Error('indexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => {
      dbPromise = null
      reject(req.error ?? new Error('IndexedDB open failed'))
    }
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
  return dbPromise
}

export type PeVideoRecord = {
  blob: Blob
  fileName: string
}

export async function saveVideoBlob(
  key: string,
  blob: Blob,
  fileName: string,
): Promise<void> {
  const db = await openPeVideoDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.objectStore(STORE).put({ blob, fileName }, key)
  })
}

export async function getVideoBlob(key: string): Promise<PeVideoRecord | undefined> {
  const db = await openPeVideoDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB read failed'))
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as PeVideoRecord | undefined)
  })
}

export async function deleteVideoBlob(key: string): Promise<void> {
  const db = await openPeVideoDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(key)
  })
}

/** Copies pending blob to a stable row key and removes pending. */
export async function movePendingVideoToRow(rowId: string): Promise<{
  storageKey: string
  fileName: string
} | null> {
  const rec = await getVideoBlob(PE_VIDEO_PENDING_KEY)
  if (!rec) return null
  const storageKey = peVideoRowStorageKey(rowId)
  await saveVideoBlob(storageKey, rec.blob, rec.fileName)
  await deleteVideoBlob(PE_VIDEO_PENDING_KEY)
  return { storageKey, fileName: rec.fileName }
}
