import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { authStore } from '@/entities/user/model/authStore'
import type { TrendRow } from '@/entities/dashboard/model/types'
import { KpiCard } from '@/shared/ui/KpiCard/KpiCard'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { LineChart } from '@/shared/ui/charts/LineChart'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import { CHART_COLORS } from '@/shared/lib/chartColors'
import { periodModeDative } from '@/shared/lib/periodFormat'
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

  const periodLabel = periodsStore.selectedPeriodLabel
  const generatedOn = new Date().toLocaleDateString('ru-RU')

  // Заголовок трендов подстраивается под текущий режим — при "по кварталу"/
  // "по году" monthly[] содержит не 12 месяцев, а все кварталы/года из
  // истории (см. periodsStore/dashboardStore), поэтому "за 12 мес" там
  // будет враньём.
  const trendSuffix =
    periodsStore.periodMode === 'year'
      ? 'по годам'
      : periodsStore.periodMode === 'quarter'
        ? 'по кварталам'
        : 'за 12 мес'

  // Подпись под дельтой KPI-карточек ("к прошлому месяцу"/"кварталу"/"году") —
  // тоже зависит от periodMode, см. комментарий в KpiCard.jsx.
  const deltaSuffix = `к прошлому ${periodModeDative(periodsStore.periodMode)}`

  // Drill-through для каждой KPI-карточки (кнопка-иконка в углу, отдельно
  // от drill-down по клику на саму карточку). Сортировка по номеру ЗН —
  // по умолчанию внутри useDrillThrough.
  const openDrillThrough = (title: string) => {
    drillThrough.open({ title })
  }

  // Клик по бару/точке на графике тренда — выбрать именно этот период.
  // Тип элемента (месяц/квартал/год) зависит от текущего periodMode,
  // поэтому режим комбобокса переключаем вслед за тем, что реально
  // кликнули, а не всегда форсируем "месяц" (как было раньше, когда тренд
  // мог быть только помесячным).
  const handleTrendClick = (item: TrendRow) => {
    if (item.PERIOD_TYPE === 'Y') {
      periodsStore.setPeriodMode('year')
      periodsStore.setSelectedYear(item.PERIOD_YEAR as number)
    } else if (item.PERIOD_TYPE === 'Q') {
      periodsStore.setPeriodMode('quarter')
      periodsStore.setSelectedQuarter(item.PERIOD_YQ as number)
    } else {
      periodsStore.setSelectedPeriod(item.PERIOD_YM as number)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Обзор — ${periodLabel}`}
        subtitle={`${authStore.currentFirm?.FIRM_SHORT_NAME || ''} · Точки роста. Сформирован ${generatedOn}`}
      />

      <AsyncBoundary
        isLoading={dashboardStore.isLoadingAny}
        error={dashboardStore.errorAny}
        isEmpty={!dashboardStore.isLoadingAny && !kpi}
        onRetry={() =>
          periodsStore.selectedPeriod && dashboardStore.load(periodsStore.selectedPeriod)
        }
      >
        {kpi && (
          <>
            <div className={styles.kpiGrid}>
              <KpiCard
                title="Оборот"
                value={formatCurrency(kpi.TURNOVER)}
                delta={formatDelta(calcDelta(kpi.TURNOVER, kpiPrev?.TURNOVER))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.TURNOVER, kpiPrev?.TURNOVER))}
                deltaSuffix={deltaSuffix}
                tooltip="Суммарный оборот за месяц"
                onClick={() => navigate('/masters')}
                onDrillThrough={() => openDrillThrough('Список ЗН за период')}
              />
              <KpiCard
                title="Заказ-нарядов"
                value={formatNumber(kpi.ACCOUNT_COUNT)}
                delta={formatDelta(calcDelta(kpi.ACCOUNT_COUNT, kpiPrev?.ACCOUNT_COUNT))}
                deltaPositive={isDeltaPositive(
                  calcDelta(kpi.ACCOUNT_COUNT, kpiPrev?.ACCOUNT_COUNT)
                )}
                deltaSuffix={deltaSuffix}
                tooltip="Количество закрытых ЗН за месяц"
                onClick={() => navigate('/masters')}
                onDrillThrough={() => openDrillThrough('Список ЗН за период')}
              />
              <KpiCard
                title="Средний чек"
                value={formatCurrency(kpi.AVG_CASH)}
                delta={formatDelta(calcDelta(kpi.AVG_CASH, kpiPrev?.AVG_CASH))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.AVG_CASH, kpiPrev?.AVG_CASH))}
                deltaSuffix={deltaSuffix}
                tooltip="Оборот ÷ количество ЗН"
                onClick={() => navigate('/brands')}
                onDrillThrough={() => openDrillThrough('ЗН с суммами')}
              />
              <KpiCard
                title="Т-фактор"
                value={formatPercent(kpi.T_FACTOR)}
                delta={formatDelta(calcDelta(kpi.T_FACTOR, kpiPrev?.T_FACTOR))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.T_FACTOR, kpiPrev?.T_FACTOR))}
                deltaSuffix={deltaSuffix}
                tooltip="Загрузка мощностей. Больше 0 — переработка норматива"
                onClick={() => navigate('/efficiency')}
                onDrillThrough={() => openDrillThrough('ЗН с расчётом Т-фактора')}
              />
              <KpiCard
                title="Аккуратность"
                value={formatPercent(kpi.ACCURACY)}
                delta={formatDelta(calcDelta(kpi.ACCURACY, kpiPrev?.ACCURACY))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.ACCURACY, kpiPrev?.ACCURACY))}
                deltaSuffix={deltaSuffix}
                tooltip="Доля ЗН без грубых отклонений"
                onClick={() => navigate('/efficiency')}
                onDrillThrough={() => openDrillThrough('ЗН за период')}
              />
              <KpiCard
                title="Выработка"
                value={formatHours(kpi.LABOR_TIME)}
                delta={formatDelta(calcDelta(kpi.LABOR_TIME, kpiPrev?.LABOR_TIME))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.LABOR_TIME, kpiPrev?.LABOR_TIME))}
                deltaSuffix={deltaSuffix}
                tooltip="Суммарные нормо-часы работ"
                onClick={() => navigate('/mechanics')}
                onDrillThrough={() => openDrillThrough('ЗН с нормо-часами')}
              />
              <KpiCard
                title="Время ремонта"
                value={formatServiceTime(kpi.AVG_SERVICE_TIME)}
                delta={formatDelta(calcDelta(kpi.AVG_SERVICE_TIME, kpiPrev?.AVG_SERVICE_TIME))}
                deltaPositive={isDeltaPositive(
                  calcDelta(kpi.AVG_SERVICE_TIME, kpiPrev?.AVG_SERVICE_TIME)
                )}
                deltaSuffix={deltaSuffix}
                tooltip="Среднее время от приёмки до выдачи"
                onClick={() => navigate('/mechanics')}
                onDrillThrough={() => openDrillThrough('ЗН со временем ремонта')}
              />
              <KpiCard
                title="Потери на ЗН"
                value={formatMinutes(kpi.WASTED_TIME_MIN)}
                delta={formatDelta(calcDelta(kpi.WASTED_TIME_MIN, kpiPrev?.WASTED_TIME_MIN))}
                deltaPositive={isDeltaPositive(
                  calcDelta(kpi.WASTED_TIME_MIN, kpiPrev?.WASTED_TIME_MIN),
                  {
                    higherIsBetter: false,
                  }
                )}
                deltaSuffix={deltaSuffix}
                tooltip="Простой на 1 ЗН. Меньше — лучше"
                onClick={() => navigate('/efficiency')}
                onDrillThrough={() => openDrillThrough('ЗН с потерями')}
              />
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h2>Оборот {trendSuffix}</h2>
                <BarChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="TURNOVER"
                  label="Оборот"
                  valueFormatter={(value) => formatCurrency(value)}
                  onBarClick={handleTrendClick}
                />
              </div>
              <div className={styles.chartCard}>
                <h2>Кол-во ЗН {trendSuffix}</h2>
                <LineChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="ACCOUNT_COUNT"
                  label="Кол-во ЗН"
                  color={CHART_COLORS.blue}
                  valueFormatter={(value) => formatNumber(value)}
                  onPointClick={handleTrendClick}
                />
              </div>
              <div className={styles.chartCard}>
                <h2>Средний чек {trendSuffix}</h2>
                <LineChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="AVG_CASH"
                  label="Ср. чек"
                  color={CHART_COLORS.positive}
                  valueFormatter={(value) => formatCurrency(value)}
                  onPointClick={handleTrendClick}
                />
              </div>
              <div className={styles.chartCard}>
                <h2>Уровень товаров {trendSuffix}</h2>
                <LineChart
                  data={monthly}
                  categoryKey="MONTH_LABEL"
                  dataKey="ARTICLE_WORK_RATIO"
                  label="Уровень товаров"
                  color={CHART_COLORS.purple}
                  valueFormatter={(value) => formatPercent(value)}
                  onPointClick={handleTrendClick}
                />
              </div>
            </div>
          </>
        )}
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
