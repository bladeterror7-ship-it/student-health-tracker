/** Жижиг Snellen харааны самбар — E, F, P, T, O, Z, L, D, C */
export default function SnellenChartSvg({ className = '' }: { className?: string }) {
  const rows = [
    { size: 14, letter: 'E' },
    { size: 11, letter: 'F' },
    { size: 9, letter: 'P' },
    { size: 7, letter: 'T' },
    { size: 6, letter: 'O' },
  ]
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      aria-hidden
      role="img"
    >
      <rect
        x="2"
        y="2"
        width="116"
        height="136"
        rx="8"
        className="fill-white stroke-emerald-300/70 dark:fill-slate-900/80 dark:stroke-emerald-500/35"
        strokeWidth="1.5"
      />
      {rows.map((row, i) => (
        <text
          key={row.letter}
          x="60"
          y={28 + i * 22}
          textAnchor="middle"
          fontSize={row.size}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          className="fill-slate-800 dark:fill-emerald-50"
        >
          {row.letter}
        </text>
      ))}
      <text
        x="60"
        y="128"
        textAnchor="middle"
        fontSize="7"
        className="fill-slate-400 dark:fill-emerald-100/50"
      >
        Snellen
      </text>
    </svg>
  )
}
