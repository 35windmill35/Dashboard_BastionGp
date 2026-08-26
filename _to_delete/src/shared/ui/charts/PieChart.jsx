import { PieChart as RPieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer } from 'recharts'
import { CHART_COLORS, CHART_PALETTE } from '@/shared/lib/chartColors'

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
export function PieChart({ data, height = 320, onSliceClick, valueFormatter }) {
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
          onClick={onSliceClick}
          cursor={onSliceClick ? 'pointer' : undefined}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Pie>
        <RTooltip
          formatter={valueFormatter}
          contentStyle={{ background: CHART_COLORS.surface, border: `1px solid ${CHART_COLORS.border}` }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.textSecondary }} />
      </RPieChart>
    </ResponsiveContainer>
  )
}

// Утилита группировки ТОП-N + "Прочие", пригодится на экране «Марки»
export function groupTopNWithOthers(items, nameKey, valueKey, n = 9, othersLabel = 'Прочие') {
  const sorted = [...items].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
  const top = sorted.slice(0, n).map((item) => ({ name: item[nameKey], value: item[valueKey] || 0 }))
  const rest = sorted.slice(n)

  if (rest.length > 0) {
    const restSum = rest.reduce((sum, item) => sum + (item[valueKey] || 0), 0)
    top.push({ name: othersLabel, value: restSum })
  }

  return top
}
