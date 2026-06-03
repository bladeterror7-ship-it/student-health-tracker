import type { ToothDef } from '../dentalChart'

export default function ToothSvg({ tooth }: { tooth: ToothDef }) {
  const primary = tooth.arch.includes('primary')
  const w = primary ? 22 : 26
  const h = primary ? 28 : 34
  return (
    <svg
      viewBox="0 0 28 36"
      width={w}
      height={h}
      className="mx-auto"
      aria-hidden
    >
      <path
        d={
          primary
            ? 'M14 2 C8 2 4 8 4 14 L4 28 C4 32 8 34 14 34 C20 34 24 32 24 28 L24 14 C24 8 20 2 14 2 Z'
            : 'M14 1 C7 1 3 7 3 14 L3 30 C3 33 7 35 14 35 C21 35 25 33 25 30 L25 14 C25 7 21 1 14 1 Z'
        }
        className="fill-white/90 stroke-current stroke-[1.5] dark:fill-slate-900/60"
      />
      <line x1="14" y1="8" x2="14" y2="26" className="stroke-current/25" strokeWidth="1" />
    </svg>
  )
}
