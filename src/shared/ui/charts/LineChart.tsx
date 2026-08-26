import type { ReactNode } from 'react'
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS } from '@/shared/lib/chartColors'

interface LineChartProps<T extends Record<string, unknown>> {
  data: T[]
  dataKey: string
  categoryKey: string
  height?: number | `${number}%`
  color?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueFormatter?: (value: any, name?: any, props?: any) => ReactNode
  onPointClick?: (item: T) => void
  label?: string
}

// Обёртка над Recharts LineChart — линейные графики "за 12 месяцев"
// (кол-во ЗН, средний чек, уровень товаров и т.п.).
//
// onPointClick(item) — клик по точке (обычно смена глобального периода).
//
// Пример:
// <LineChart data={dashboardStore.monthly} categoryKey="MONTH_LABEL" dataKey="ACCOUNT_COUNT"
//   onPointClick={(item) => periodsStore.setSelectedPeriod(item.PERIOD_YM)} />
export function LineChart<T extends Record<string, unknown>>({
  data,
  dataKey,
  categoryKey,
  height = 280,
  color = CHART_COLORS.accent,
  valueFormatter,
  onPointClick,
  // Русское название метрики для подсказки — см. комментарий в BarChart.jsx.
  label,
}: LineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis dataKey={categoryKey} stroke={CHART_COLORS.textSecondary} fontSize={12} />
        <YAxis stroke={CHART_COLORS.textSecondary} fontSize={12} />
        <RTooltip
          formatter={valueFormatter}
          contentStyle={{
            background: CHART_COLORS.surface,
            border: `1px solid ${CHART_COLORS.border}`,
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={label || dataKey}
          stroke={color}
          strokeWidth={2}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dot={(dotProps: any) => {
            const { cx, cy, payload, key } = dotProps
            return (
              <circle
                key={key}
                cx={cx}
                cy={cy}
                r={4}
                fill={color}
                style={{ cursor: onPointClick ? 'pointer' : undefined }}
                onClick={onPointClick ? () => onPointClick(payload) : undefined}
              />
            )
          }}
          activeDot={{ r: 6 }}
        />
      </RLineChart>
    </ResponsiveContainer>
  )
}
