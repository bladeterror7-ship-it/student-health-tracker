import { uid } from './uid'
import type { PeTutorialPublish } from '../types'
import {
  deleteVideoBlob,
  getVideoBlob,
  openPeVideoDb,
  saveVideoBlob,
} from './peVideoDb'

const LS_MANIFEST_KEY = 'pe-teacher-tutorials-manifest-v1'

export const TEACHER_TUTORIAL_EVENT = 'pe-teacher-tutorials-changed'

export function tutorialStorageKey(tutorialId: string): string {
  return `tutorial_${tutorialId}`
}

function persistManifest(list: PeTutorialPublish[]) {
  try {
    localStorage.setItem(LS_MANIFEST_KEY, JSON.stringify(list))
  } catch {
    /* quota */
  }
  window.dispatchEvent(new CustomEvent(TEACHER_TUTORIAL_EVENT))
}

export function readTutorialManifest(): PeTutorialPublish[] {
  try {
    const raw = localStorage.getItem(LS_MANIFEST_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as PeTutorialPublish[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function publishTutorial(payload: {
  title: string
  description: string
  classGroup: string
  file: File
}): Promise<PeTutorialPublish> {
  await openPeVideoDb()
  const id = uid('tt')
  const storageKey = tutorialStorageKey(id)
  await saveVideoBlob(storageKey, payload.file, payload.file.name)

  const row: PeTutorialPublish = {
    id,
    title: payload.title.trim(),
    description: payload.description.trim(),
    classGroup: payload.classGroup.trim(),
    storageKey,
    fileName: payload.file.name,
    createdAt: new Date().toISOString(),
  }

  persistManifest([row, ...readTutorialManifest()])
  return row
}

export async function deleteTutorial(id: string): Promise<void> {
  const list = readTutorialManifest()
  const found = list.find((t) => t.id === id)
  if (!found) return
  await openPeVideoDb()
  await deleteVideoBlob(found.storageKey)
  persistManifest(list.filter((t) => t.id !== id))
}

export async function getTutorialBlob(
  storageKey: string,
): Promise<Blob | null> {
  const rec = await getVideoBlob(storageKey)
  return rec?.blob ?? null
}
