import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { KpiCard } from '@/shared/ui/KpiCard/KpiCard'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { DataTable } from '@/shared/ui/DataTable/DataTable'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import { formatPercent, formatMinutes, formatHours, formatServiceTime, cleanName } from '@/shared/lib/formatters'
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

  const kpi = dashboardStore.kpi
  const masters = dashboardStore.mastersFiltered
  const marks = dashboardStore.marks

  const tFactorData = masters.filter((m) => m.T_FACTOR !== null && m.T_FACTOR !== undefined)
  const wastedData = masters.filter((m) => m.WASTED_TIME_MIN !== null && m.WASTED_TIME_MIN !== undefined)
  const sortedMarks = [...marks].sort((a, b) => (b.TURNOVER || 0) - (a.TURNOVER || 0))

  // Учитываем sticky-шапку (id стабильный, в отличие от хэшированного
  // CSS-модуль класса — см. widgets/app-header/AppHeader.jsx).
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Эффективность</h1>

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
                tooltip="Загрузка мощностей"
                onClick={() => scrollToElement(tFactorRef)}
              />
              <KpiCard
                title="Потери на ЗН"
                value={formatMinutes(kpi.WASTED_TIME_MIN)}
                tooltip="Простой на ЗН, меньше — лучше"
                onClick={() => scrollToElement(wastedRef)}
              />
              <KpiCard
                title="Аккуратность"
                value={formatPercent(kpi.ACCURACY)}
                tooltip="Качество исполнения"
                onClick={() => scrollToElement(marksRef)}
              />
              <KpiCard
                title="Выработка"
                value={formatHours(kpi.LABOR_TIME)}
                tooltip="Суммарные нормо-часы"
                onClick={() => navigate('/mechanics')}
              />
            </div>

            <div className={styles.chartsRow}>
              <div className={styles.chartWrapper} ref={tFactorRef}>
                <h3 className={styles.chartTitle}>Т-фактор по мастерам</h3>
                <BarChart
                  layout="vertical"
                  data={tFactorData}
                  categoryKey="MASTER_NAME"
                  dataKey="T_FACTOR"
                  valueFormatter={(value) => formatPercent(value)}
                  onBarClick={(item) => goToMasterDrillDown(item.MASTER_ID)}
                />
              </div>

              <div className={styles.chartWrapper} ref={wastedRef}>
                <h3 className={styles.chartTitle}>Потери на ЗН по мастерам</h3>
                <BarChart
                  layout="vertical"
                  data={wastedData}
                  categoryKey="MASTER_NAME"
                  dataKey="WASTED_TIME_MIN"
                  valueFormatter={(value) => formatMinutes(value)}
                  onBarClick={(item) => goToMasterDrillDown(item.MASTER_ID)}
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
          </>
        )}
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
