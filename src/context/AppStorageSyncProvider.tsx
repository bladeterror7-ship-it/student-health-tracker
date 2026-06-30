import { useEffect, useRef } from 'react'
import { fetchAllAppStorage } from '../lib/neonAppStorage'
import {
  applyRemoteStorageItems,
  broadcastStorageRefresh,
  migrateLocalOnlyKeys,
} from '../lib/installStorageSync'
import { syncPeVideoBlobsFromRemote } from '../lib/peVideoBlobSync'

const PULL_INTERVAL_MS = 30_000

export function AppStorageSyncProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pulledOnce = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function pullAndMerge() {
      try {
        const items = await fetchAllAppStorage()
        if (cancelled) return

        const remoteKeys = new Set(items.map((i) => i.storageKey))
        const changed = applyRemoteStorageItems(items)

        let didMigrate = false
        if (!pulledOnce.current) {
          pulledOnce.current = true
          await migrateLocalOnlyKeys(remoteKeys)
          didMigrate = true
        }

        await syncPeVideoBlobsFromRemote()
        if (cancelled) return

        if (changed.length > 0 || didMigrate) {
          broadcastStorageRefresh()
        }
      } catch (error) {
        console.warn('[storage-sync] pull:', error)
      }
    }

    void pullAndMerge()
    const interval = window.setInterval(() => {
      void pullAndMerge()
    }, PULL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return children
}
