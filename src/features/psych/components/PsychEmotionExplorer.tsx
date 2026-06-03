import { motion } from 'framer-motion'
import { SmilePlus } from 'lucide-react'
import { useState } from 'react'
import { PSYCH_EMOTIONS, type EmotionDetail } from '../data/emotionData'
import PsychEmotionModal from './PsychEmotionModal'
import { PsychSectionShell } from './PsychSectionShell'

export default function PsychEmotionExplorer() {
  const [active, setActive] = useState<EmotionDetail | null>(null)

  return (
    <>
      <PsychSectionShell
        icon={SmilePlus}
        title="Сэтгэл хөдлөлийн талаар"
        subtitle="Эможи дээр дарж тодорхойлолт, нөлөө, зохицох аргыг уншина уу"
      >
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"
          role="group"
          aria-label="Сэтгэл хөдлөл сонгох"
        >
          {PSYCH_EMOTIONS.map((e) => (
            <motion.button
              key={e.id}
              type="button"
              onClick={() => setActive(e)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/55 bg-white/65 px-3 py-4 shadow-sm transition hover:border-violet-400/40 hover:bg-white/90 dark:border-white/10 dark:bg-black/25 dark:hover:border-violet-400/35 dark:hover:bg-black/35"
            >
              <span className="text-[2.5rem] leading-none">{e.emoji}</span>
              <span className="text-center text-xs font-semibold leading-tight text-slate-800 dark:text-violet-100">
                {e.title}
              </span>
            </motion.button>
          ))}
        </div>
      </PsychSectionShell>

      <PsychEmotionModal emotion={active} onClose={() => setActive(null)} />
    </>
  )
}
