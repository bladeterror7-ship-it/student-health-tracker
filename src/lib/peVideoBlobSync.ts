import {
  blobToBase64,
  base64ToBlob,
  deleteAppBlobRemote,
  fetchAppBlob,
  listAppBlobKeys,
  pushAppBlob,
} from './neonAppStorage'
import {
  deleteVideoBlob,
  getVideoBlob,
  openPeVideoDb,
  type PeVideoRecord,
} from './peVideoDb'

const blobPushTimers = new Map<string, ReturnType<typeof setTimeout>>()
let blobPullInProgress = false

function scheduleBlobPush(key: string, rec: PeVideoRecord) {
  if (blobPullInProgress) return
  const prev = blobPushTimers.get(key)
  if (prev) clearTimeout(prev)
  blobPushTimers.set(
    key,
    setTimeout(() => {
      blobPushTimers.delete(key)
      void (async () => {
        try {
          const base64 = await blobToBase64(rec.blob)
          await pushAppBlob({
            blobKey: key,
            fileName: rec.fileName,
            mimeType: rec.blob.type || 'application/octet-stream',
            base64,
          })
        } catch (err) {
          console.warn('[blob-sync] push:', key, err)
        }
      })()
    }, 800),
  )
}

export async function syncPeVideoBlobAfterSave(
  key: string,
  blob: Blob,
  fileName: string,
): Promise<void> {
  scheduleBlobPush(key, { blob, fileName })
}

export async function syncPeVideoBlobAfterDelete(key: string): Promise<void> {
  try {
    await deleteAppBlobRemote(key)
  } catch (err) {
    console.warn('[blob-sync] delete:', key, err)
  }
}

export async function syncPeVideoBlobsFromRemote(): Promise<void> {
  blobPullInProgress = true
  try {
    const remoteKeys = await listAppBlobKeys()
    const db = await openPeVideoDb()

    for (const key of remoteKeys) {
      const local = await getVideoBlob(key)
      const remote = await fetchAppBlob(key)
      if (!remote) continue

      if (local && local.fileName === remote.fileName) {
        const localSize = local.blob.size
        const remoteSize = Math.floor((remote.base64.length * 3) / 4)
        if (Math.abs(localSize - remoteSize) < 64) continue
      }

      const blob = base64ToBlob(remote.base64, remote.mimeType)
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('blobs', 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () =>
          reject(tx.error ?? new Error('IndexedDB transaction failed'))
        tx.objectStore('blobs').put(
          { blob, fileName: remote.fileName },
          key,
        )
      })
    }

    const localKeys = await listLocalBlobKeys(db)
    for (const key of localKeys) {
      if (remoteKeys.includes(key)) continue
      const rec = await getVideoBlob(key)
      if (rec) scheduleBlobPush(key, rec)
    }
  } catch (err) {
    console.warn('[blob-sync] pull:', err)
  } finally {
    blobPullInProgress = false
  }
}

function listLocalBlobKeys(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blobs', 'readonly')
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB read failed'))
    const req = tx.objectStore('blobs').getAllKeys()
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String))
  })
}

export async function removeLocalAndRemoteBlob(key: string): Promise<void> {
  await deleteVideoBlob(key)
  await syncPeVideoBlobAfterDelete(key)
}
