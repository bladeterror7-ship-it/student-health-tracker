import PsychEmotionExplorer from './PsychEmotionExplorer'
import PsychGeometryTest from './PsychGeometryTest'
import PsychLoveLanguagesQuiz from './PsychLoveLanguagesQuiz'

/** Сэтгэл зүйн таб дээр нэмэгдэх 3 интерактив хэсэг */
export default function StudentPsychInteractiveHub() {
  return (
    <div className="space-y-5">
      <PsychEmotionExplorer />
      <PsychLoveLanguagesQuiz />
      <PsychGeometryTest />
    </div>
  )
}
