import {
  ScatterChart as RScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS } from '@/shared/lib/chartColors'

// Точечный график (см. ТЗ, экран «Механики»: «Потери vs Аккуратность»).
// Точки с null по xKey/yKey нужно отфильтровать ДО передачи сюда (см.
// TASK-DEV-B.md) — компонент их не фильтрует сам.
//
// onPointClick(item) — клик по точке (drill-through)
// getColor(item) — необязательно: цвет конкретной точки (например, зелёная
// точка для хорошего сочетания метрик, красная — для плохого, см. «Потери
// vs Аккуратность» в референсе из ТЗ). Если не задан — все точки цвета color.
//
// Пример:
// <ScatterChart
//   data={dashboardStore.mechanicsFiltered.filter(m => m.WASTED_TIME_MIN != null && m.ACCURACY != null)}
//   xKey="WASTED_TIME_MIN" xLabel="Потери, мин"
//   yKey="ACCURACY" yLabel="Аккуратность, %"
//   nameKey="MECHANIC_NAME"
//   getColor={(m) => (m.ACCURACY >= 75 ? CHART_COLORS.positive : CHART_COLORS.negative)}
//   onPointClick={(item) => openDrillThrough(item)}
// />
export function ScatterChart({
  data,
  xKey,
  yKey,
  nameKey,
  xLabel,
  yLabel,
  height = 320,
  color = CHART_COLORS.accent,
  getColor,
  onPointClick,
  nameFormatter,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey={xKey}
          name={xLabel}
          stroke={CHART_COLORS.textSecondary}
          fontSize={12}
          label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -4, fontSize: 12, fill: CHART_COLORS.textSecondary } : undefined}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yLabel}
          stroke={CHART_COLORS.textSecondary}
          fontSize={12}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12, fill: CHART_COLORS.textSecondary } : undefined}
        />
        <RTooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: CHART_COLORS.surface, border: `1px solid ${CHART_COLORS.border}` }}
          formatter={(value, name, item) => [value, name]}
          labelFormatter={() => ''}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const point = payload[0].payload
            return (
              <div
                style={{
                  background: CHART_COLORS.surface,
                  border: `1px solid ${CHART_COLORS.border}`,
                  padding: 8,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                {nameKey && (
                  <div style={{ fontWeight: 600 }}>
                    {nameFormatter ? nameFormatter(point[nameKey]) : point[nameKey]}
                  </div>
                )}
                <div>{xLabel}: {point[xKey]}</div>
                <div>{yLabel}: {point[yKey]}</div>
              </div>
            )
          }}
        />
        <Scatter data={data} fill={color} onClick={onPointClick} cursor={onPointClick ? 'pointer' : undefined}>
          {getColor && data.map((item, i) => <Cell key={i} fill={getColor(item)} />)}
        </Scatter>
      </RScatterChart>
    </ResponsiveContainer>
  )
}
