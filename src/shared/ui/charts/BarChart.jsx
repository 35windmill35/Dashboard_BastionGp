import {
  BarChart as RBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS } from '@/shared/lib/chartColors'

// Обёртка над Recharts BarChart — единый стиль осей/сетки/тултипа на всех
// экранах. layout="horizontal" (по умолчанию, столбцы вертикальные, как
// «Оборот за 12 мес») или layout="vertical" (столбцы горизонтальные, как
// «Т-фактор по мастерам»).
//
// dataKey — поле для высоты/длины столбца (Y в горизонтальном layout —
// категория, задаётся через categoryKey).
// onBarClick(item) — клик по столбцу (drill-through/смена периода).
// tooltipFormatter(value, item) — необязательно, для кастомного текста тултипа.
//
// Пример (вертикальные столбцы, «Обзор»):
// <BarChart data={dashboardStore.monthly} categoryKey="MONTH_LABEL" dataKey="TURNOVER"
//   onBarClick={(item) => periodsStore.setSelectedPeriod(item.PERIOD_YM)} />
//
// Пример (горизонтальные столбцы, «Эффективность»):
// <BarChart layout="vertical" data={masters} categoryKey="MASTER_NAME" dataKey="T_FACTOR"
//   onBarClick={(item) => openDrillThrough(item)} />
//
// highlightKey/highlightValue — необязательно: если задать (например,
// highlightKey="MASTER_ID" highlightValue={selectedMasterId}), столбец с
// совпадающим значением подсвечивается акцентным цветом, остальные —
// приглушённым (см. ТЗ «Мастера»: клик по карточке подсвечивает на графиках).
//
// colorBySign — необязательно: красит столбец в акцентный (положительное
// значение) или в негативный (отрицательное) цвет вместо одного сплошного
// — см. «Т-фактор по мастерам» в референсе (ТЗ), где отрицательный
// Т-фактор показан красным. Несовместимо одновременно с highlightKey.
//
// getColor(item) — необязательно: цвет конкретного столбца по любой другой
// логике (например, "потери выше среднего — красный, ниже — зелёный", см.
// «Потери на ЗН по мастерам» в референсе). Приоритет ниже, чем у
// highlightKey, но выше, чем у colorBySign.
export function BarChart({
  data,
  dataKey,
  categoryKey,
  layout = 'horizontal',
  height = 280,
  color = CHART_COLORS.accent,
  valueFormatter,
  onBarClick,
  highlightKey,
  highlightValue,
  colorBySign = false,
  getColor,
  // Русское название метрики для подсказки (например, "Оборот") — без него
  // Recharts по умолчанию подставляет в тултип сырой dataKey (TURNOVER,
  // AVG_CASH и т.п.), что не по ТЗ (там везде человекочитаемый текст вида
  // «Год: оборот ₽») и непонятно обычному пользователю.
  label,
  // Форматирует подпись категории на оси и в тултипе, не трогая сами данные
  // (нужно для сокращения ФИО мастеров/механиков до "Фамилия И.О.")
  categoryFormatter,
}) {
  const isVertical = layout === 'vertical'
  const hasHighlight = highlightKey !== undefined && highlightValue !== undefined && highlightValue !== null

  // Для вертикального layout высота растёт с числом категорий — иначе на
  // экранах с длинным списком (мастера/механики) Recharts сам скрывает
  // часть подписей через одну, если высоты на всех не хватает (~36px на
  // строку — примерно высота бара + промежуток). height проп по-прежнему
  // работает как нижняя граница/фиксированная высота для горизонтальных
  // графиков. height="100%" (строкой) пропускаем как есть — так родитель
  // может растянуть график на всю доступную высоту флекс-контейнера
  // (нужно, когда рядом стоит график другого типа с иной высотой по
  // умолчанию, см. MechanicsPage.jsx — иначе оси X у них не совпадают).
  const resolvedHeight =
    isVertical && typeof height === 'number' ? Math.max(height, data.length * 36 + 40) : height

  // Ширина колонки с именами категорий — фиксированные 140px не хватало на
  // длинные ФИО (см. баг-репорт: "имена не влезают"). Считаем по самой
  // длинной подписи после categoryFormatter, а не в притык под конкретное
  // имя.
  const yAxisWidth = isVertical
    ? Math.min(
        220,
        Math.max(
          100,
          data.reduce((max, d) => {
            const label = categoryFormatter ? categoryFormatter(d[categoryKey]) : d[categoryKey]
            return Math.max(max, String(label ?? '').length)
          }, 0) *
            7 +
            24
        )
      )
    : undefined

  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <RBarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        {isVertical ? (
          <>
            <XAxis type="number" stroke={CHART_COLORS.textSecondary} fontSize={12} />
            <YAxis
              type="category"
              dataKey={categoryKey}
              tickFormatter={categoryFormatter}
              stroke={CHART_COLORS.textSecondary}
              fontSize={12}
              width={yAxisWidth}
              interval={0}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} tickFormatter={categoryFormatter} stroke={CHART_COLORS.textSecondary} fontSize={12} />
            <YAxis stroke={CHART_COLORS.textSecondary} fontSize={12} />
          </>
        )}
        <RTooltip
          formatter={valueFormatter}
          labelFormatter={categoryFormatter}
          contentStyle={{ background: CHART_COLORS.surface, border: `1px solid ${CHART_COLORS.border}` }}
        />
        <Bar
          dataKey={dataKey}
          name={label || dataKey}
          fill={color}
          radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          onClick={onBarClick}
          cursor={onBarClick ? 'pointer' : undefined}
        >
          {hasHighlight &&
            data.map((item, i) => (
              <Cell
                key={i}
                fill={item[highlightKey] === highlightValue ? CHART_COLORS.accent : CHART_COLORS.border}
              />
            ))}
          {!hasHighlight &&
            getColor &&
            data.map((item, i) => <Cell key={i} fill={getColor(item)} />)}
          {!hasHighlight &&
            !getColor &&
            colorBySign &&
            data.map((item, i) => (
              <Cell key={i} fill={(item[dataKey] || 0) < 0 ? CHART_COLORS.negative : CHART_COLORS.accent} />
            ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  )
}
