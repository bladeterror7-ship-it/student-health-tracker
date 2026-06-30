const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type AppStorageItem = {
  storageKey: string
  data: string
  updatedAt: string
}

export type AppBlobDto = {
  blobKey: string
  fileName: string
  mimeType: string
  base64: string
  updatedAt: string
}

type ApiPayload = Record<string, unknown>

async function readApiJson(res: Response): Promise<ApiPayload> {
  const text = await res.text()
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error(`Сервер хоосон хариу (HTTP ${res.status})`)
  }
  try {
    return JSON.parse(trimmed) as ApiPayload
  } catch {
    throw new Error(`Серверийн алдаа (${res.status})`)
  }
}

function reasonFromPayload(data: ApiPayload, fallback: string): string {
  const reason = data.reason
  const error = data.error
  if (typeof reason === 'string' && reason) return reason
  if (typeof error === 'string' && error) return error
  return fallback
}

export async function fetchAllAppStorage(): Promise<AppStorageItem[]> {
  const res = await fetch(`${API_BASE}/api/app-storage`, {
    headers: { Accept: 'application/json' },
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Өгөгдөл татахад алдаа'))
  }
  const raw = data.items
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as AppStorageItem
      if (!o.storageKey) return null
      return {
        storageKey: String(o.storageKey),
        data: typeof o.data === 'string' ? o.data : '',
        updatedAt: String(o.updatedAt ?? ''),
      }
    })
    .filter((x): x is AppStorageItem => x !== null)
}

export async function pushAppStorageKey(
  storageKey: string,
  data: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/app-storage`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ storageKey, data }),
  })
  const payload = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(payload, 'Өгөгдөл хадгалахад алдаа'))
  }
}

export async function pushAppStorageBatch(
  items: { storageKey: string; data: string }[],
): Promise<void> {
  if (items.length === 0) return
  const res = await fetch(`${API_BASE}/api/app-storage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ items }),
  })
  const payload = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(payload, 'Өгөгдөл илгээхэд алдаа'))
  }
}

export async function listAppBlobKeys(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/app-blobs`, {
    headers: { Accept: 'application/json' },
  })
  const data = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Blob жагсаалт татахад алдаа'))
  }
  const raw = data.keys
  return Array.isArray(raw) ? raw.map(String) : []
}

export async function fetchAppBlob(blobKey: string): Promise<AppBlobDto | null> {
  const res = await fetch(
    `${API_BASE}/api/app-blobs?key=${encodeURIComponent(blobKey)}`,
    { headers: { Accept: 'application/json' } },
  )
  const data = await readApiJson(res)
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(reasonFromPayload(data, 'Blob татахад алдаа'))
  }
  const blob = data.blob as AppBlobDto | undefined
  if (!blob?.blobKey || !blob.base64) return null
  return blob
}

export async function pushAppBlob(input: {
  blobKey: string
  fileName: string
  mimeType?: string
  base64: string
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/app-blobs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  })
  const payload = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(payload, 'Blob хадгалахад алдаа'))
  }
}

export async function deleteAppBlobRemote(blobKey: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/app-blobs/${encodeURIComponent(blobKey)}`,
    { method: 'DELETE', headers: { Accept: 'application/json' } },
  )
  if (res.status === 404) return
  const payload = await readApiJson(res)
  if (!res.ok) {
    throw new Error(reasonFromPayload(payload, 'Blob устгахад алдаа'))
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType || 'application/octet-stream' })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('FileReader failed'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

export { base64ToBlob }
