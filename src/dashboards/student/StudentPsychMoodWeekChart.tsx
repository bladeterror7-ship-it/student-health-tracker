import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  XAxis,
  YAxis,
} from 'recharts'
import type { DotItemDotProps } from 'recharts'
import {
  PSYCH_MOOD_EMOJI_BY_ID,
  type PsychMoodId,
} from './StudentPsychMoodPicker.tsx'

/** Онооны хүрээнээс ойролцоох сэтгэл — өнөөдөр биш өдрүүдийн жижиг эмоди. */
function inferredMoodFromScore(score: number): PsychMoodId {
  if (score >= 9) return 'happy'
  if (score >= 7) return 'content'
  if (score >= 4.5) return 'tired'
  if (score >= 2) return 'stressed'
  return 'sad'
}

export type PsychWeekChartPayload = {
  dayLabel: string
  score: number
  /** yyyy-mm-dd */
  dateKey: string
  isToday: boolean
  moodGuess: PsychMoodId
  /** Өнөөдрийн сонгосон сэтгэл — графикийн эмодиг data-аар шинэчлэгдэнэ. */
  todayMood: PsychMoodId | null
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

/** 7 өдөр: эхний 6 нь түүх, сүүлийн нь «өнөөр». */
export function buildPsychWeekChartData(
  weeklyScores: readonly number[],
  activeMood: PsychMoodId | null = null,
  endDate = new Date(),
): PsychWeekChartPayload[] {
  const todayKey = formatDateKey(endDate)
  return weeklyScores.map((score, i) => {
    const d = new Date(endDate)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    const dateKey = formatDateKey(d)
    const isToday = dateKey === todayKey
    return {
      dayLabel: String(i + 1),
      score: Number(score),
      dateKey,
      isToday,
      moodGuess: inferredMoodFromScore(Number(score)),
      todayMood: isToday ? activeMood : null,
    }
  })
}

function rowFromDotProps(props: DotItemDotProps): PsychWeekChartPayload | null {
  const fromPayload = props.payload as PsychWeekChartPayload | undefined
  if (fromPayload?.dateKey) return fromPayload
  const fromPoints = props.points?.[props.index]?.payload as
    | PsychWeekChartPayload
    | undefined
  return fromPoints?.dateKey ? fromPoints : null
}

function emojiForDot(row: PsychWeekChartPayload): string {
  if (row.isToday && row.todayMood) return PSYCH_MOOD_EMOJI_BY_ID[row.todayMood]
  return PSYCH_MOOD_EMOJI_BY_ID[row.moodGuess]
}

/**
 * Recharts CustomizedDot — өнөөдрийн цэг дээр том эмоди.
 * @see https://recharts.github.io/en-US/examples/CustomizedDotLineChart/
 */
function CustomizedDot(props: DotItemDotProps) {
  const { cx, cy, index } = props
  const plot = usePlotArea()
  const row = rowFromDotProps(props)

  if (cx == null || cy == null || row == null) return null

  const isToday = row.isToday
  const isTodayHighlighted = Boolean(isToday && row.todayMood)
  const emoji = emojiForDot(row)
  const fontSize = isTodayHighlighted ? 24 : isToday ? 20 : 15
  const haloRadius = isTodayHighlighted ? 20 : isToday ? 16 : 11
  const gapBelowEmoji = fontSize / 2 + 2
  const baselineY =
    plot != null ? plot.y + plot.height - 4 : cy + 72

  return (
    <g className={isToday ? 'psych-chart-dot--today' : undefined}>
      {isTodayHighlighted ? (
        <line
          x1={cx}
          x2={cx}
          y1={cy + gapBelowEmoji}
          y2={baselineY}
          stroke="rgb(139 92 246 / 0.45)"
          strokeWidth={1.25}
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={haloRadius}
        fill={
          isTodayHighlighted
            ? 'rgb(255 255 255 / 0.88)'
            : 'rgb(255 255 255 / 0.45)'
        }
        stroke="rgb(167 139 250 / 0.55)"
        strokeWidth={isTodayHighlighted ? 2 : 1}
        style={{
          filter: isTodayHighlighted
            ? 'drop-shadow(0 2px 8px rgb(139 92 246 / 0.35))'
            : undefined,
        }}
        className="dark:stroke-violet-300/55 dark:fill-white/15"
      />
      <text
        key={`psych-dot-${index}-${row.todayMood ?? row.moodGuess}-${emoji}`}
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        aria-hidden
        style={{
          pointerEvents: 'none',
          fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        {emoji}
      </text>
    </g>
  )
}

/** Recharts Line график — 7 хоногийн настроение. */
export default function StudentPsychMoodWeekChart({
  weeklyScores,
  activeMood,
}: {
  weeklyScores: readonly number[]
  activeMood: PsychMoodId | null
}) {
  const data = useMemo(
    () => buildPsychWeekChartData(weeklyScores, activeMood, new Date()),
    [weeklyScores, activeMood],
  )

  const chartKey = `${activeMood ?? 'none'}-${weeklyScores.join(',')}`

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Графикийн өгөгдөл байхгүй байна.
      </p>
    )
  }

  return (
    <div className="w-full min-h-[238px] overflow-visible pb-3 pt-1">
      <ResponsiveContainer width="100%" height={238} minHeight={200}>
        <LineChart
          key={chartKey}
          data={data}
          margin={{ top: 28, right: 12, left: 4, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 14"
            vertical={false}
            stroke="rgb(139 92 246 / 0.14)"
          />
          <XAxis
            dataKey="dayLabel"
            type="category"
            tick={{ fill: 'rgb(100 116 139)', fontSize: 11 }}
            tickLine={{ stroke: 'rgb(148 163 184 / 0.35)' }}
            axisLine={{ stroke: 'rgb(148 163 184 / 0.25)' }}
          />
          <YAxis
            type="number"
            domain={[0, 10]}
            allowDecimals={false}
            tickCount={6}
            width={28}
            tick={{ fill: 'rgb(100 116 139)', fontSize: 11 }}
            tickLine={{ stroke: 'transparent' }}
            axisLine={{ stroke: 'rgb(148 163 184 / 0.25)' }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.875rem',
              border: '1px solid rgb(167 139 250 / 0.35)',
              backgroundColor: 'rgb(255 255 255 / 0.94)',
              boxShadow: '0 10px 28px rgb(139 92 246 / 0.12)',
            }}
            labelFormatter={(_, items) =>
              Array.isArray(items) && items[0]?.payload
                ? String(
                    (items[0].payload as PsychWeekChartPayload).dateKey ?? '',
                  )
                : ''
            }
            formatter={(value: unknown) => [
              `${String(value)} / 10`,
              'Насстроение',
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="Насстроение"
            stroke="#8b5cf6"
            strokeWidth={2.75}
            connectNulls
            isAnimationActive={false}
            dot={CustomizedDot}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
