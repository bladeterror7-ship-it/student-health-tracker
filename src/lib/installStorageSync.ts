import {
  pushAppStorageKey,
  pushAppStorageBatch,
  type AppStorageItem,
} from './neonAppStorage'
import {
  broadcastStorageRefresh,
  shouldSyncStorageKey,
} from './storageSyncEvents'

const PUSH_DEBOUNCE_MS = 400
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pushing = new Set<string>()

let installed = false
let syncPullInProgress = false

const origSetItem = localStorage.setItem.bind(localStorage)
const origRemoveItem = localStorage.removeItem.bind(localStorage)

function schedulePush(key: string, data: string) {
  if (!shouldSyncStorageKey(key) || syncPullInProgress) return
  const prev = pushTimers.get(key)
  if (prev) clearTimeout(prev)
  pushTimers.set(
    key,
    setTimeout(() => {
      pushTimers.delete(key)
      if (pushing.has(key)) return
      pushing.add(key)
      void pushAppStorageKey(key, data)
        .catch((err) => console.warn('[storage-sync] push:', key, err))
        .finally(() => pushing.delete(key))
    }, PUSH_DEBOUNCE_MS),
  )
}

function scheduleDelete(key: string) {
  if (!shouldSyncStorageKey(key) || syncPullInProgress) return
  schedulePush(key, '')
}

export function installStorageSync(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  localStorage.setItem = (key: string, value: string) => {
    origSetItem(key, value)
    schedulePush(key, value)
  }

  localStorage.removeItem = (key: string) => {
    origRemoveItem(key)
    scheduleDelete(key)
  }
}

export function applyRemoteStorageItems(items: AppStorageItem[]): string[] {
  syncPullInProgress = true
  const changed: string[] = []
  const remoteKeys = new Set<string>()

  try {
    for (const item of items) {
      if (!shouldSyncStorageKey(item.storageKey)) continue
      remoteKeys.add(item.storageKey)
      const local = localStorage.getItem(item.storageKey)
      if (local === item.data) continue
      if (item.data === '') {
        origRemoveItem(item.storageKey)
      } else {
        origSetItem(item.storageKey, item.data)
      }
      changed.push(item.storageKey)
    }
  } finally {
    syncPullInProgress = false
  }

  return changed
}

export async function migrateLocalOnlyKeys(
  remoteKeys: Set<string>,
): Promise<void> {
  const toUpload: { storageKey: string; data: string }[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !shouldSyncStorageKey(key) || remoteKeys.has(key)) continue
    const data = localStorage.getItem(key)
    if (data != null) toUpload.push({ storageKey: key, data })
  }
  if (toUpload.length === 0) return
  await pushAppStorageBatch(toUpload)
}

export function isStorageSyncInstalled(): boolean {
  return installed
}

export { broadcastStorageRefresh }
