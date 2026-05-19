import { useEffect, useState } from 'react'
import {
  readTutorialManifest,
  TEACHER_TUTORIAL_EVENT,
} from '../lib/teacherTutorialStorage'

export function useTutorialManifest() {
  const [manifest, setManifest] = useState(readTutorialManifest)

  useEffect(() => {
    function sync() {
      setManifest(readTutorialManifest())
    }
    window.addEventListener(TEACHER_TUTORIAL_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(TEACHER_TUTORIAL_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return manifest
}
