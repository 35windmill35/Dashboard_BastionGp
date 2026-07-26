import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { DataTable } from '@/shared/ui/DataTable/DataTable'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import {
  formatCurrency,
  formatPercent,
  formatHours,
  calcDelta,
  formatDelta,
  isDeltaPositive,
  cleanName,
} from '@/shared/lib/formatters'
import { formatPeriodLabel } from '@/shared/lib/periodFormat'
import styles from './Masters.module.css'

// Экран «Мастера» (ТЗ §4.3). Карточка мастера = drill-down: локальное
// выделение (подсветка карточки, строки таблицы и столбца на графиках),
// БЕЗ перехода на другой экран. Клик по графику/строке таблицы = drill-through
// (список ЗН). Если пришли с «Эффективности» с highlightMasterId в state
// навигации — выделяем этого мастера сразу при открытии экрана.
export const MastersPage = observer(function MastersPage() {
  const location = useLocation()
  const drillThrough = useDrillThrough()

  const [selectedMasterId, setSelectedMasterId] = useState(
    location.state?.highlightMasterId ?? null
  )

  const masters = dashboardStore.mastersFiltered
  const mastersPrev = dashboardStore.mastersPrev

  const prevById = new Map(mastersPrev.map((m) => [m.MASTER_ID, m]))

  const openMasterDrillThrough = (master) => {
    drillThrough.open({
      title: `Заказ-наряды мастера «${cleanName(master.MASTER_NAME)}»`,
      filterString: 'MASTER_ID=?',
      filterParam: [master.MASTER_ID],
    })
  }

  const periodLabel = periodsStore.selectedPeriodYm ? formatPeriodLabel(periodsStore.selectedPeriodYm) : ''

  return (
    <div className={styles.page}>
      <PageHeader title="Мастера" subtitle={`Статистика по мастерам — ${periodLabel}`} />

      <AsyncBoundary
        isLoading={dashboardStore.isLoadingAny}
        error={dashboardStore.errorAny}
        isEmpty={!dashboardStore.isLoadingAny && masters.length === 0}
        onRetry={() => periodsStore.selectedPeriodYm && dashboardStore.load(periodsStore.selectedPeriodYm)}
      >
        <div className={styles.cardsGrid}>
          {masters.map((m) => (
            <div
              key={m.MASTER_ID}
              className={`${styles.masterCard} ${selectedMasterId === m.MASTER_ID ? styles.masterCardSelected : ''}`}
              onClick={() => setSelectedMasterId(m.MASTER_ID)}
            >
              <div className={styles.masterName}>{cleanName(m.MASTER_NAME) || '—'}</div>
              <div className={styles.masterMetrics}>
                <Tooltip text="Доля мастера в обороте автоцентра">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Доля оборота</span>
                    <span className={styles.metricValue}>{formatPercent(m.TURNOVER_SHARE)}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Оборот мастера">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Оборот</span>
                    <span className={styles.metricValue}>{formatCurrency(m.TURNOVER)}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Кол-во ЗН мастера">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>ЗН</span>
                    <span className={styles.metricValue}>{m.ACCOUNT_COUNT ?? '—'}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Оборот ÷ ЗН">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Средний чек</span>
                    <span className={styles.metricValue}>{formatCurrency(m.AVG_CASH)}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Товары/работы, %">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Уровень товаров</span>
                    <span className={styles.metricValue}>{formatPercent(m.ARTICLE_WORK_RATIO)}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Загрузка">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Т-фактор</span>
                    <span className={styles.metricValue}>{formatPercent(m.T_FACTOR)}</span>
                  </div>
                </Tooltip>
                <Tooltip text="Качество">
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Аккуратность</span>
                    <span className={styles.metricValue}>{formatPercent(m.ACCURACY)}</span>
                  </div>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chartsRow}>
          <div className={styles.chartWrapper}>
            <h3 className={styles.chartTitle}>Оборот по мастерам</h3>
            <BarChart
              data={masters}
              categoryKey="MASTER_NAME"
              dataKey="TURNOVER"
              valueFormatter={(value) => formatCurrency(value)}
              onBarClick={openMasterDrillThrough}
              highlightKey="MASTER_ID"
              highlightValue={selectedMasterId}
            />
          </div>

          <div className={styles.chartWrapper}>
            <h3 className={styles.chartTitle}>Кол-во ЗН по мастерам</h3>
            <BarChart
              data={masters}
              categoryKey="MASTER_NAME"
              dataKey="ACCOUNT_COUNT"
              onBarClick={openMasterDrillThrough}
              highlightKey="MASTER_ID"
              highlightValue={selectedMasterId}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <h3 className={styles.tableTitle}>Продуктивность и эффективность</h3>
          <DataTable
            columns={[
              { key: 'MASTER_NAME', header: 'Мастер', render: (r) => cleanName(r.MASTER_NAME) || '—' },
              { key: 'ACCOUNT_COUNT', header: 'ЗН' },
              { key: 'TURNOVER', header: 'Оборот', render: (r) => formatCurrency(r.TURNOVER) },
              { key: 'AVG_CASH', header: 'Ср. чек', render: (r) => formatCurrency(r.AVG_CASH) },
              { key: 'ARTICLE_WORK_RATIO', header: 'Доля товаров', render: (r) => formatPercent(r.ARTICLE_WORK_RATIO) },
              { key: 'LABOR_TIME', header: 'Выработка', tooltip: 'Суммарные нормо-часы', render: (r) => formatHours(r.LABOR_TIME) },
              {
                key: 'T_FACTOR',
                header: 'Т-фактор (Δ)',
                tooltip: 'Загрузка мощностей. Δ — к предыдущему месяцу',
                render: (r) => {
                  const prev = prevById.get(r.MASTER_ID)
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
              { key: 'WASTED_TIME_MIN', header: 'Потери', render: (r) => `${r.WASTED_TIME_MIN ?? '—'} мин` },
              { key: 'ACCURACY', header: 'Аккуратность', render: (r) => formatPercent(r.ACCURACY) },
            ]}
            data={masters}
            getRowKey={(r) => r.MASTER_ID}
            onRowClick={openMasterDrillThrough}
          />
        </div>
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
