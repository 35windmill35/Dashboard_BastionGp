import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { KpiCard } from '@/shared/ui/KpiCard/KpiCard'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { DataTable } from '@/shared/ui/DataTable/DataTable'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { InsightBanner } from '@/shared/ui/InsightBanner/InsightBanner'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import {
  formatPercent,
  formatMinutes,
  formatHours,
  formatServiceTime,
  calcDelta,
  formatDelta,
  isDeltaPositive,
  cleanName,
} from '@/shared/lib/formatters'
import { CHART_COLORS } from '@/shared/lib/chartColors'
import { formatPeriodLabel } from '@/shared/lib/periodFormat'
import styles from './Efficiency.module.css'

// Экран «Эффективность» (ТЗ §4.2). Про клик на графиках «Т-фактор» и
// «Потери» по мастерам: это drill-down на экран «Мастера» с выделением
// (навигация с highlightMasterId, см. TASK-DEV-A.md/TASK-DEV-B.md — там же
// дальнейший drill-through к ЗН через таблицу на самом экране «Мастера»).
// Таблица марок — отдельный drill-through (список ЗН по марке) прямо здесь.
export const EfficiencyPage = observer(function EfficiencyPage() {
  const navigate = useNavigate()
  const drillThrough = useDrillThrough()

  const tFactorRef = useRef(null)
  const wastedRef = useRef(null)
  const marksRef = useRef(null)

  // ТЗ §4.2 требует для этих двух графиков и drill-down (клик по мастеру →
  // «Мастера» с выделением), и отдельный drill-through (список ЗН мастера).
  // Один клик по столбцу не может делать оба действия одновременно, поэтому
  // над каждым графиком — переключатель режима клика; по умолчанию
  // drill-down (более частый сценарий — посмотреть карточку мастера).
  const [tFactorMode, setTFactorMode] = useState('drilldown')
  const [wastedMode, setWastedMode] = useState('drilldown')

  const kpi = dashboardStore.kpi
  const kpiPrev = dashboardStore.kpiPrev
  const masters = dashboardStore.mastersFiltered
  const marks = dashboardStore.marks

  const tFactorData = masters.filter((m) => m.T_FACTOR !== null && m.T_FACTOR !== undefined)
  const wastedData = masters.filter((m) => m.WASTED_TIME_MIN !== null && m.WASTED_TIME_MIN !== undefined)
  const sortedMarks = [...marks].sort((a, b) => (b.TURNOVER || 0) - (a.TURNOVER || 0))

  // Средние потери по мастерам — точка отсчёта "хорошо/плохо" для
  // раскраски столбцов (см. референс в ТЗ: выше среднего — красный, ниже —
  // зелёный). Не строгое бизнес-правило, а наглядная подсветка на глаз.
  const avgWastedTime = wastedData.length
    ? wastedData.reduce((sum, m) => sum + m.WASTED_TIME_MIN, 0) / wastedData.length
    : 0

  // Сводки-подсказки внизу экрана (см. референс в ТЗ): мастер с
  // наибольшими и с наименьшими потерями на ЗН. Наглядная подсказка "на
  // что посмотреть в первую очередь", а не строгая аналитика — считаем
  // прямо на фронте по уже загруженным данным месяца, без похода в API.
  const wastedBySizeDesc = [...wastedData].sort((a, b) => b.WASTED_TIME_MIN - a.WASTED_TIME_MIN)
  const worstMaster = wastedBySizeDesc[0]
  const bestMaster = wastedBySizeDesc[wastedBySizeDesc.length - 1]
  const getSurname = (name) => cleanName(name).split(' ')[0] || '—'

  // Учитываем узкую панель фильтров над контентом (id стабильный, в
  // отличие от хэшированного CSS-модуль класса — см. widgets/app-sidebar/AppTopBar.jsx).
  const scrollToElement = (ref) => {
    if (!ref.current) return
    const header = document.getElementById('app-header')
    const headerHeight = header ? header.offsetHeight : 80
    const top = ref.current.getBoundingClientRect().top + window.scrollY - headerHeight - 16
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const goToMasterDrillDown = (masterId) => {
    navigate('/masters', { state: { highlightMasterId: masterId } })
  }

  const openMarkDrillThrough = (mark) => {
    drillThrough.open({
      title: `Заказ-наряды по марке «${cleanName(mark.MARK_NAME)}»`,
      filterString: 'MARK_ID=?',
      filterParam: [mark.MARK_ID],
    })
  }

  const openMasterDrillThrough = (master, subtitle) => {
    drillThrough.open({
      title: `${subtitle} мастера «${cleanName(master.MASTER_NAME)}»`,
      filterString: 'MASTER_ID=?',
      filterParam: [master.MASTER_ID],
    })
  }

  const periodLabel = periodsStore.selectedPeriodYm ? formatPeriodLabel(periodsStore.selectedPeriodYm) : ''

  return (
    <div className={styles.page}>
      <PageHeader
        title="Т-фактор, потери, аккуратность"
        subtitle={`${periodLabel} — операционная эффективность`}
      />

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
                title="Т-фактор"
                value={formatPercent(kpi.T_FACTOR)}
                delta={formatDelta(calcDelta(kpi.T_FACTOR, kpiPrev?.T_FACTOR))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.T_FACTOR, kpiPrev?.T_FACTOR))}
                tooltip="Загрузка мощностей"
                onClick={() => scrollToElement(tFactorRef)}
              />
              <KpiCard
                title="Потери на ЗН"
                value={formatMinutes(kpi.WASTED_TIME_MIN)}
                delta={formatDelta(calcDelta(kpi.WASTED_TIME_MIN, kpiPrev?.WASTED_TIME_MIN))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.WASTED_TIME_MIN, kpiPrev?.WASTED_TIME_MIN), {
                  higherIsBetter: false,
                })}
                tooltip="Снижение = улучшение"
                onClick={() => scrollToElement(wastedRef)}
              />
              <KpiCard
                title="Аккуратность"
                value={formatPercent(kpi.ACCURACY)}
                delta={formatDelta(calcDelta(kpi.ACCURACY, kpiPrev?.ACCURACY))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.ACCURACY, kpiPrev?.ACCURACY))}
                tooltip="Качество исполнения"
                onClick={() => scrollToElement(marksRef)}
              />
              <KpiCard
                title="Выработка"
                value={formatHours(kpi.LABOR_TIME)}
                delta={formatDelta(calcDelta(kpi.LABOR_TIME, kpiPrev?.LABOR_TIME))}
                deltaPositive={isDeltaPositive(calcDelta(kpi.LABOR_TIME, kpiPrev?.LABOR_TIME))}
                tooltip="Суммарная"
                onClick={() => navigate('/mechanics')}
              />
            </div>

            <div className={styles.chartsRow}>
              <div className={styles.chartWrapper} ref={tFactorRef}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Т-фактор по мастерам</h3>
                  <div className={styles.modeToggle}>
                    <button
                      type="button"
                      className={tFactorMode === 'drilldown' ? styles.modeBtnActive : styles.modeBtn}
                      onClick={() => setTFactorMode('drilldown')}
                    >
                      Мастер
                    </button>
                    <button
                      type="button"
                      className={tFactorMode === 'drillthrough' ? styles.modeBtnActive : styles.modeBtn}
                      onClick={() => setTFactorMode('drillthrough')}
                    >
                      Список ЗН
                    </button>
                  </div>
                </div>
                <BarChart
                  layout="vertical"
                  data={tFactorData}
                  categoryKey="MASTER_NAME"
                  dataKey="T_FACTOR"
                  colorBySign
                  valueFormatter={(value) => formatPercent(value)}
                  onBarClick={(item) =>
                    tFactorMode === 'drilldown'
                      ? goToMasterDrillDown(item.MASTER_ID)
                      : openMasterDrillThrough(item, 'Список ЗН')
                  }
                />
              </div>

              <div className={styles.chartWrapper} ref={wastedRef}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Потери на ЗН по мастерам</h3>
                  <div className={styles.modeToggle}>
                    <button
                      type="button"
                      className={wastedMode === 'drilldown' ? styles.modeBtnActive : styles.modeBtn}
                      onClick={() => setWastedMode('drilldown')}
                    >
                      Мастер
                    </button>
                    <button
                      type="button"
                      className={wastedMode === 'drillthrough' ? styles.modeBtnActive : styles.modeBtn}
                      onClick={() => setWastedMode('drillthrough')}
                    >
                      Список ЗН
                    </button>
                  </div>
                </div>
                <BarChart
                  layout="vertical"
                  data={wastedData}
                  categoryKey="MASTER_NAME"
                  dataKey="WASTED_TIME_MIN"
                  getColor={(m) => (m.WASTED_TIME_MIN > avgWastedTime ? CHART_COLORS.negative : CHART_COLORS.positive)}
                  valueFormatter={(value) => formatMinutes(value)}
                  onBarClick={(item) =>
                    wastedMode === 'drilldown'
                      ? goToMasterDrillDown(item.MASTER_ID)
                      : openMasterDrillThrough(item, 'ЗН с потерями')
                  }
                />
              </div>
            </div>

            <div className={styles.tableWrapper} ref={marksRef}>
              <h3 className={styles.tableTitle}>Эффективность по маркам</h3>
              <DataTable
                columns={[
                  { key: 'MARK_NAME', header: 'Марка', render: (r) => cleanName(r.MARK_NAME) || '—' },
                  {
                    key: 'AVG_SERVICE_TIME',
                    header: 'Время ремонта',
                    tooltip: 'Среднее время ремонта по марке',
                    render: (r) => formatServiceTime(r.AVG_SERVICE_TIME),
                  },
                  {
                    key: 'LABOR_TIME',
                    header: 'Выработка',
                    tooltip: 'Суммарные нормо-часы',
                    render: (r) => formatHours(r.LABOR_TIME),
                  },
                  {
                    key: 'T_FACTOR',
                    header: 'Т-фактор',
                    tooltip: 'Загрузка мощностей',
                    render: (r) => formatPercent(r.T_FACTOR),
                  },
                  {
                    key: 'WASTED_TIME_MIN',
                    header: 'Потери',
                    tooltip: 'Простой на ЗН',
                    render: (r) => formatMinutes(r.WASTED_TIME_MIN),
                  },
                  {
                    key: 'ACCURACY',
                    header: 'Аккуратность',
                    tooltip: 'Качество исполнения',
                    render: (r) => formatPercent(r.ACCURACY),
                  },
                ]}
                data={sortedMarks}
                getRowKey={(r) => r.MARK_ID}
                onRowClick={openMarkDrillThrough}
              />
            </div>

            {worstMaster && bestMaster && worstMaster !== bestMaster && (
              <div className={styles.insightsRow}>
                <InsightBanner
                  variant="warning"
                  title={`Высокие потери у ${getSurname(worstMaster.MASTER_NAME)}`}
                  description={`${formatMinutes(worstMaster.WASTED_TIME_MIN)} потерь на ЗН — существенно выше среднего (${formatMinutes(avgWastedTime)}). Требует разбора.`}
                />
                <InsightBanner
                  variant="success"
                  title={`${getSurname(bestMaster.MASTER_NAME)} — минимальные потери`}
                  description={`Всего ${formatMinutes(bestMaster.WASTED_TIME_MIN)} потерь, аккуратность ${formatPercent(bestMaster.ACCURACY)}. Лучший показатель по потерям среди мастеров.`}
                />
              </div>
            )}
          </>
        )}
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
