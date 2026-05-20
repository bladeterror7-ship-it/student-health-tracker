import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { VIVERA_COLORS } from '../constants'
import type { WeekDayEntry } from '../utils/weeklyStats'
import { formatLiters } from '../utils/weeklyStats'

type Props = {
  days: WeekDayEntry[]
  dailyGoalMl: number
}

function chartRows(days: WeekDayEntry[]) {
  return days.map((d) => ({
    ...d,
    intakeL: d.intakeMl / 1000,
    goalL: d.goalMl / 1000,
  }))
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: WeekDayEntry & { intakeL: number } }[]
}) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-vivera-primary/20 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{row.dayLabel}</p>
      <p className="text-vivera-primary">
        {formatLiters(row.intakeMl)} / {formatLiters(row.goalMl)}
      </p>
      <p className="text-slate-500">{row.fillPercent}% · {row.plantEmoji}</p>
    </div>
  )
}

export default function WeeklyChart({ days, dailyGoalMl }: Props) {
  const data = chartRows(days)
  const goalL = dailyGoalMl / 1000
  const maxY = Math.max(goalL * 1.25, ...data.map((d) => d.intakeL), 0.5)

  return (
    <div className="h-[220px] w-full sm:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 4 }}>
          <defs>
            <linearGradient id="viveraBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VIVERA_COLORS.primary} />
              <stop offset="100%" stopColor={VIVERA_COLORS.secondary} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="dayLabel"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, maxY]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Number(v).toFixed(1)}л`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,122,255,0.06)' }} />
          <ReferenceLine
            y={goalL}
            stroke={VIVERA_COLORS.primary}
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: `Зорилт ${goalL.toFixed(1)}л`,
              position: 'insideTopRight',
              fill: VIVERA_COLORS.primary,
              fontSize: 10,
            }}
          />
          <Bar dataKey="intakeL" radius={[8, 8, 0, 0]} maxBarSize={40}>
            {data.map((entry) => (
              <Cell
                key={entry.dateKey}
                fill={
                  entry.isFuture
                    ? '#e2e8f0'
                    : 'url(#viveraBarGradient)'
                }
                opacity={entry.isFuture ? 0.45 : entry.isToday ? 1 : 0.88}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
