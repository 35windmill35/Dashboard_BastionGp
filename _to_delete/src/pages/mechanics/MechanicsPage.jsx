import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { KpiCard } from '@/shared/ui/KpiCard/KpiCard'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { ScatterChart } from '@/shared/ui/charts/ScatterChart'
import { DataTable } from '@/shared/ui/DataTable/DataTable'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import { CHART_COLORS } from '@/shared/lib/chartColors'
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatHours,
  formatServiceTime,
  calcDelta,
  formatDelta,
  isDeltaPositive,
  formatShortName,
} from '@/shared/lib/formatters'
import { periodModeDative } from '@/shared/lib/periodFormat'
import styles from './Mechanics.module.css'

// Экран «Механики» (ТЗ §4.4). В ответе API нет своего mechanicsPrev (в
// отличие от mastersPrev) — данные за предыдущий период для Δ Т-фактора
// подгружаются отдельным запросом на фронте (см. dashboardStore.js,
// mechanicsPrev/loadPrevPeriod), тем же методом getDashboardData.
export const MechanicsPage = observer(function MechanicsPage() {
  const drillThrough = useDrillThrough()

  const mechanics = dashboardStore.mechanicsFiltered
  const mechanicsPrev = dashboardStore.mechanicsPrev
  const prevById = new Map(mechanicsPrev.map((m) => [m.MECHANIC_ID, m]))

  const mechanicCount = mechanics.length
  const totalTurnover = mechanics.reduce((sum, m) => sum + (m.TURNOVER || 0), 0)

  const withAccountCount = mechanics.filter((m) => m.ACCOUNT_COUNT !== null && m.ACCOUNT_COUNT !== undefined)
  const avgAccountCount = withAccountCount.length
    ? withAccountCount.reduce((sum, m) => sum + m.ACCOUNT_COUNT, 0) / withAccountCount.length
    : null

  const withAccuracy = mechanics.filter((m) => m.ACCURACY !== null && m.ACCURACY !== undefined)
  const avgAccuracy = withAccuracy.length
    ? withAccuracy.reduce((sum, m) => sum + m.ACCURACY, 0) / withAccuracy.length
    : null

  const turnoverData = mechanics
    .filter((m) => m.TURNOVER !== null && m.TURNOVER !== undefined)
    .sort((a, b) => b.TURNOVER - a.TURNOVER)

  const scatterData = mechanics.filter(
    (m) =>
      m.WASTED_TIME_MIN !== null &&
      m.WASTED_TIME_MIN !== undefined &&
      m.ACCURACY !== null &&
      m.ACCURACY !== undefined
  )

  // В агрегатах ("mechanics") поле называется MECHANIC_ID, а в самих
  // заказ-нарядах (AccountListDashboardGrowingPoints) — MAIN_MECHANIC_ID.
  // Разные имена в разных методах API, это подтверждено реальным ответом
  // сервера 26.07.2026 (см. dashboardApi.js).
  const openMechanicDrillThrough = (mechanic) => {
    drillThrough.open({
      title: `Заказ-наряды механика «${formatShortName(mechanic.MECHANIC_NAME)}»`,
      filterString: 'MAIN_MECHANIC_ID=?',
      filterParam: [mechanic.MECHANIC_ID],
    })
  }

  const periodLabel = periodsStore.selectedPeriodLabel

  // "Оборот по механикам" (вертикальный BarChart) и "Потери vs Аккуратность"
  // (ScatterChart) стоят рядом в один ряд — раньше у них были разные
  // дефолтные высоты (280 vs 320), из-за чего ось X слева заканчивалась
  // выше, чем справа, и снизу оставалось пустое место. Формула та же, что
  // внутри BarChart.jsx для vertical layout — считаем явно и передаём в оба
  // графика, чтобы оси совпадали независимо от числа механиков.
  const mechanicsChartHeight = Math.max(320, turnoverData.length * 36 + 40)

  return (
    <div className={styles.page}>
      <PageHeader title="Механики" subtitle={`Статистика по исполнителям — ${periodLabel}`} />

      <AsyncBoundary
        isLoading={dashboardStore.isLoadingAny}
        error={dashboardStore.errorAny}
        isEmpty={!dashboardStore.isLoadingAny && mechanics.length === 0}
        onRetry={() => periodsStore.selectedPeriod && dashboardStore.load(periodsStore.selectedPeriod)}
      >
        <div className={styles.kpiGrid}>
          <KpiCard title="Механиков" value={formatNumber(mechanicCount)} tooltip="Число механиков с ЗН" />
          <KpiCard
            title="Суммарный оборот"
            value={formatCurrency(totalTurnover)}
            tooltip="Оборот по всем механикам"
          />
          <KpiCard
            title="Среднее ЗН"
            value={formatNumber(avgAccountCount, { decimals: 1 })}
            tooltip="Среднее число ЗН на механика"
          />
          <KpiCard
            title="Средняя аккуратность"
            value={formatPercent(avgAccuracy)}
            tooltip="Средняя по механикам"
          />
        </div>

        <div className={styles.chartsRow}>
          <div className={styles.chartWrapper}>
            <h3 className={styles.chartTitle}>Оборот по механикам</h3>
            <div className={styles.chartFill} style={{ minHeight: mechanicsChartHeight }}>
              <BarChart
                layout="vertical"
                data={turnoverData}
                categoryKey="MECHANIC_NAME"
                dataKey="TURNOVER"
                label="Оборот"
                height="100%"
                valueFormatter={(value) => formatCurrency(value)}
                categoryFormatter={formatShortName}
                onBarClick={openMechanicDrillThrough}
              />
            </div>
          </div>

          <div className={styles.chartWrapper}>
            <h3 className={styles.chartTitle}>Потери vs Аккуратность</h3>
            <p className={styles.scatterNote}>Оптимум — левый верх: меньше потерь, выше аккуратность</p>
            <div className={styles.chartFill} style={{ minHeight: mechanicsChartHeight }}>
              <ScatterChart
                data={scatterData}
                xKey="WASTED_TIME_MIN"
                yKey="ACCURACY"
                nameKey="MECHANIC_NAME"
                xLabel="Потери, мин"
                yLabel="Аккуратность, %"
                height="100%"
                getColor={(m) => (m.ACCURACY >= 75 ? CHART_COLORS.positive : CHART_COLORS.negative)}
                onPointClick={openMechanicDrillThrough}
                nameFormatter={formatShortName}
              />
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <h3 className={styles.tableTitle}>Полная таблица механиков</h3>
          <DataTable
            columns={[
              { key: 'MECHANIC_NAME', header: 'Механик', render: (r) => formatShortName(r.MECHANIC_NAME) || '—' },
              {
                key: 'ACCOUNT_COUNT',
                header: 'ЗН',
                tooltip: 'Количество заказ-нарядов',
                render: (r) => formatNumber(r.ACCOUNT_COUNT),
              },
              { key: 'TURNOVER', header: 'Оборот', render: (r) => formatCurrency(r.TURNOVER) },
              { key: 'AVG_CASH', header: 'Ср. чек', tooltip: 'Оборот ÷ ЗН', render: (r) => formatCurrency(r.AVG_CASH) },
              {
                key: 'ARTICLE_WORK_RATIO',
                header: 'Доля товаров',
                tooltip: 'Товары/работы, %',
                render: (r) => formatPercent(r.ARTICLE_WORK_RATIO),
              },
              {
                key: 'AVG_SERVICE_TIME',
                header: 'Время ремонта',
                render: (r) => formatServiceTime(r.AVG_SERVICE_TIME),
              },
              { key: 'LABOR_TIME', header: 'Выработка', tooltip: 'Суммарные нормо-часы', render: (r) => formatHours(r.LABOR_TIME) },
              {
                key: 'T_FACTOR',
                header: 'Т-фактор (Δ)',
                tooltip: `Загрузка мощностей. Δ — к предыдущему ${periodModeDative(periodsStore.periodMode)}`,
                render: (r) => {
                  const prev = prevById.get(r.MECHANIC_ID)
                  const delta = prev ? calcDelta(r.T_FACTOR, prev.T_FACTOR) : null
                  const positive = isDeltaPositive(delta)
                  return (
                    <>
                      {formatPercent(r.T_FACTOR)}{' '}
                      <span className={positive === true ? styles.deltaPositive : positive === false ? styles.deltaNegative : styles.deltaNeutral}>
                        {formatDelta(delta)}
                      </span>
                    </>
                  )
                },
              },
              {
                key: 'WASTED_TIME_MIN',
                header: 'Потери',
                tooltip: 'Простой на ЗН',
                render: (r) => `${formatNumber(r.WASTED_TIME_MIN)} мин`,
              },
              {
                key: 'ACCURACY',
                header: 'Аккуратность',
                tooltip: 'Качество исполнения',
                render: (r) => formatPercent(r.ACCURACY),
              },
            ]}
            data={mechanics}
            getRowKey={(r) => r.MECHANIC_ID}
            onRowClick={openMechanicDrillThrough}
          />
        </div>
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
