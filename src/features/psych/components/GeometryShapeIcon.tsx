import type { GeometryShapeId } from '../data/geometryData'

const shapeClass =
  'stroke-violet-700 dark:stroke-violet-200 fill-violet-500/20 dark:fill-violet-500/25'

export default function GeometryShapeIcon({
  id,
  className = 'size-12',
}: {
  id: GeometryShapeId
  className?: string
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {id === 'square' && (
        <rect x="10" y="10" width="28" height="28" rx="2" className={shapeClass} strokeWidth="2.5" />
      )}
      {id === 'triangle' && (
        <polygon points="24,8 42,40 6,40" className={shapeClass} strokeWidth="2.5" />
      )}
      {id === 'rectangle' && (
        <rect x="8" y="14" width="32" height="22" rx="2" className={shapeClass} strokeWidth="2.5" />
      )}
      {id === 'circle' && (
        <circle cx="24" cy="24" r="16" className={shapeClass} strokeWidth="2.5" />
      )}
      {id === 'zigzag' && (
        <polyline
          points="6,32 14,16 22,36 30,12 38,28 42,20"
          className={`${shapeClass} fill-none`}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
