import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { authStore } from '@/entities/user/model/authStore'
import { KpiCard } from '@/shared/ui/KpiCard/KpiCard'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { LineChart } from '@/shared/ui/charts/LineChart'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import {
  formatCurrency,
  formatPercent,
  formatHours,
  formatServiceTime,
  formatMinutes,
  formatNumber,
  calcDelta,
  formatDelta,
  isDeltaPositive,
} from '@/shared/lib/formatters'
import styles from './OverviewPage.module.css'

// Экран «Обзор» (ТЗ §4.1) — эталонная реализация: 8 KPI-карточек + 4
// графика "за 12 месяцев". Остальные разработчики могут ориентироваться
// на этот файл как на пример использования shared/ui и dashboardStore.
export const OverviewPage = observer(function OverviewPage() {
  const navigate = useNavigate()
  const drillThrough = useDrillThrough()

  const kpi = dashboardStore.kpi
  const kpiPrev = dashboardStore.kpiPrev
  const monthly = dashboardStore.monthly

  const openAllAccounts = (title) => {
    drillThrough.open({ title })
  }

  return (
    <div className={styles.page}>
      <h1>Обзор — {authStore.currentFirm?.FIRM_SHORT_NAME}</h1>

      <AsyncBoundary
        isLoading={dashboardStore.isLoadingAny}
        error={dashboardStore.errorAny}
        isEmpty={!dashboardStore.isLoadingAny && !kpi}
        onRetry={() => periodsStore.selectedPeriodYm && dashboardStore.load(periodsStore.selectedPeriodYm)}
      >
        {kpi && (
          <>
            <div className={styles.kpiGrid}>
              <KpiCard
                title="Оборот"
                value={formatCurrency(kpi.TURNOVER)}
                delta={formatDelta(calcDelta(kpi.TURNOVER, kpiPrev?.TURNOVER))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.TURNOVER, kpiPrev?.TURNOVER))}
                tooltip="Суммарный оборот за месяц"
                onClick={() => navigate('/masters')}
              />
              <KpiCard
                title="Заказ-нарядов"
                value={formatNumber(kpi.ACCOUNT_COUNT)}
                delta={formatDelta(calcDelta(kpi.ACCOUNT_COUNT, kpiPrev?.ACCOUNT_COUNT))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.ACCOUNT_COUNT, kpiPrev?.ACCOUNT_COUNT))}
                tooltip="Количество закрытых ЗН за месяц"
                onClick={() => navigate('/masters')}
              />
              <KpiCard
                title="Средний чек"
                value={formatCurrency(kpi.AVG_CASH)}
                delta={formatDelta(calcDelta(kpi.AVG_CASH, kpiPrev?.AVG_CASH))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.AVG_CASH, kpiPrev?.AVG_CASH))}
                tooltip="Оборот ÷ количество ЗН"
                onClick={() => navigate('/brands')}
              />
              <KpiCard
                title="Т-фактор"
                value={formatPercent(kpi.T_FACTOR)}
                delta={formatDelta(calcDelta(kpi.T_FACTOR, kpiPrev?.T_FACTOR))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.T_FACTOR, kpiPrev?.T_FACTOR))}
                tooltip="Загрузка мощностей. Больше 0 — переработка норматива"
                onClick={() => navigate('/efficiency')}
              />
              <KpiCard
                title="Аккуратность"
                value={formatPercent(kpi.ACCURACY)}
                delta={formatDelta(calcDelta(kpi.ACCURACY, kpiPrev?.ACCURACY))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.ACCURACY, kpiPrev?.ACCURACY))}
                tooltip="Доля ЗН без грубых отклонений"
                onClick={() => navigate('/efficiency')}
              />
              <KpiCard
                title="Выработка"
                value={formatHours(kpi.LABOR_TIME)}
                delta={formatDelta(calcDelta(kpi.LABOR_TIME, kpiPrev?.LABOR_TIME))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.LABOR_TIME, kpiPrev?.LABOR_TIME))}
                tooltip="Суммарные нормо-часы работ"
                onClick={() => navigate('/mechanics')}
              />
              <KpiCard
                title="Время ремонта"
                value={formatServiceTime(kpi.AVG_SERVICE_TIME)}
                delta={formatDelta(calcDelta(kpi.AVG_SERVICE_TIME, kpiPrev?.AVG_SERVICE_TIME))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.AVG_SERVICE_TIME, kpiPrev?.AVG_SERVICE_TIME))}
                tooltip="Среднее время от приёмки до выдачи"
                onClick={() => navigate('/mechanics')}
              />
              <KpiCard
                title="Потери на ЗН"
                value={formatMinutes(kpi.WASTED_TIME_MIN)}
                delta={formatDelta(calcDelta(kpi.WASTED_TIME_MIN, kpiPrev?.WASTED_TIME_MIN))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.WASTED_TIME_MIN, kpiPrev?.WASTED_TIME_MIN), {
                  higherIsBetter: false,
                })}
                tooltip="Простой на 1 ЗН. Меньше — лучше"
                onClick={() => navigate('/efficiency')}
              />
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h2>Оборот за 12 мес</h2>
                <BarChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="TURNOVER"
                  valueFormatter={(value) => formatCurrency(value)}
                  onBarClick={(item) => periodsStore.setSelectedPeriod(item.PERIOD_YM)}
                />
              </div>
              <div className={styles.chartCard}>
                <h2>Кол-во ЗН за 12 мес</h2>
                <LineChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="ACCOUNT_COUNT"
                  valueFormatter={(value) => formatNumber(value)}
                  onPointClick={(item) => periodsStore.setSelectedPeriod(item.PERIOD_YM)}
                />
              </div>
              <div className={styles.chartCard}>
                <h2>Средний чек за 12 мес</h2>
                <LineChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="AVG_CASH"
                  valueFormatter={(value) => formatCurrency(value)}
                  onPointClick={(item) => periodsStore.setSelectedPeriod(item.PERIOD_YM)}
                />
              </div>
              <div className={styles.chartCard}>
                <h2>Уровень товаров за 12 мес</h2>
                <LineChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="ARTICLE_WORK_RATIO"
                  valueFormatter={(value) => formatPercent(value)}
                  onPointClick={(item) => periodsStore.setSelectedPeriod(item.PERIOD_YM)}
                />
              </div>
            </div>

            <button className={styles.debugLink} type="button" onClick={() => openAllAccounts('Список ЗН за период')}>
              Проверить drill-through модалку
            </button>
          </>
        )}
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
