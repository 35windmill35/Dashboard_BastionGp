import type { ReactNode } from 'react'
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS, CHART_PALETTE } from '@/shared/lib/chartColors'

export interface PieSlice {
  name: string
  value: number
}

interface PieChartProps {
  data: PieSlice[]
  height?: number | `${number}%`
  onSliceClick?: (item: PieSlice) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormatter?: (value: any, name?: any, props?: any) => ReactNode
}

// Круговая диаграмма (см. ТЗ: «Доля оборота по маркам», ТОП-9 + «Прочие»).
// Группировку ТОП-9 + «Прочие» делает вызывающий код (страница) — этот
// компонент просто рисует то, что ему передали в data.
//
// data: [{ name, value }] — например [{ name: 'Toyota', value: 1234567 }, ...]
// onSliceClick(item) — клик по сектору (drill-down/drill-through)
//
// Пример:
// const top9 = groupTop9WithOthers(dashboardStore.marks, 'MARK_NAME', 'TURNOVER')
// <PieChart data={top9} onSliceClick={(item) => filterByMark(item.name)} />
export function PieChart({ data, height = 320, onSliceClick, valueFormatter }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="45%"
          outerRadius="80%"
          paddingAngle={2}
          onClick={onSliceClick as never}
          cursor={onSliceClick ? 'pointer' : undefined}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Pie>
        <RTooltip
          formatter={valueFormatter}
          contentStyle={{
            background: CHART_COLORS.surface,
            border: `1px solid ${CHART_COLORS.border}`,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.textSecondary }} />
      </RPieChart>
    </ResponsiveContainer>
  )
}

// Утилита группировки ТОП-N + "Прочие", пригодится на экране «Марки»
// eslint-disable-next-line react-refresh/only-export-components
export function groupTopNWithOthers<T extends Record<string, unknown>>(
  items: T[],
  nameKey: keyof T & string,
  valueKey: keyof T & string,
  n = 9,
  othersLabel = 'Прочие'
): PieSlice[] {
  const sorted = [...items].sort(
    (a, b) => ((b[valueKey] as number) || 0) - ((a[valueKey] as number) || 0)
  )
  const top: PieSlice[] = sorted
    .slice(0, n)
    .map((item) => ({ name: item[nameKey] as string, value: (item[valueKey] as number) || 0 }))
  const rest = sorted.slice(n)

  if (rest.length > 0) {
    const restSum = rest.reduce((sum, item) => sum + ((item[valueKey] as number) || 0), 0)
    top.push({ name: othersLabel, value: restSum })
  }

  return top
}
