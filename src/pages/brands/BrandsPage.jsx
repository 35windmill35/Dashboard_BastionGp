import { useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { BarChart } from '@/shared/ui/charts/BarChart'
import { LineChart } from '@/shared/ui/charts/LineChart'
import { PieChart, groupTopNWithOthers } from '@/shared/ui/charts/PieChart'
import { DataTable } from '@/shared/ui/DataTable/DataTable'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { useDrillThrough } from '@/features/drill-through/model/useDrillThrough'
import { DrillThroughModal } from '@/features/drill-through/ui/DrillThroughModal'
import { formatCurrency, formatPercent, formatNumber, cleanName } from '@/shared/lib/formatters'
import { CHART_COLORS } from '@/shared/lib/chartColors'
import { formatPeriodLabel } from '@/shared/lib/periodFormat'
import styles from './Brands.module.css'

const TABS = [
  { key: 'marks', label: 'Марки' },
  { key: 'models', label: 'Модели' },
  { key: 'years', label: 'По году выпуска' },
]

// Экран «Марки/Модели/Годы» (ТЗ §4.5) — три вкладки в пределах одной
// страницы (без отдельных маршрутов), чтобы сохранить единый глобальный
// фильтр по периоду/автоцентру сразу для всех трёх. Переход «Марки» →
// «Модели» с предфильтром по марке — через локальный state экрана.
export const BrandsPage = observer(function BrandsPage() {
  const drillThrough = useDrillThrough()
  const [activeTab, setActiveTab] = useState('marks')
  const [markFilter, setMarkFilter] = useState(null) // { id, name } | null

  const marks = dashboardStore.marks
  const models = dashboardStore.models
  const years = dashboardStore.yearsFiltered

  const marksPieData = useMemo(() => groupTopNWithOthers(marks, 'MARK_NAME', 'TURNOVER', 9), [marks])
  const sortedMarks = useMemo(() => [...marks].sort((a, b) => (b.TURNOVER || 0) - (a.TURNOVER || 0)), [marks])

  // Средний чек по тем же топ-9 маркам, что и в круговой диаграмме слева
  // (просьба заказчика — иначе на двух графиках разные наборы марок).
  // Для "Прочих" считаем не среднее из средних, а честный взвешенный чек:
  // сумма оборота / сумма ЗН по всем маркам, не попавшим в топ-9.
  const avgCashData = useMemo(() => {
    const top9 = sortedMarks.slice(0, 9)
    const rest = sortedMarks.slice(9)

    const data = top9.map((m) => ({ name: cleanName(m.MARK_NAME), value: m.AVG_CASH || 0, MARK_ID: m.MARK_ID }))

    if (rest.length) {
      const restTurnover = rest.reduce((sum, m) => sum + (m.TURNOVER || 0), 0)
      const restCount = rest.reduce((sum, m) => sum + (m.ACCOUNT_COUNT || 0), 0)
      data.push({ name: 'Прочие', value: restCount ? restTurnover / restCount : 0 })
    }

    return data
  }, [sortedMarks])

  const filteredModels = markFilter ? models.filter((m) => m.MARK_ID === markFilter.id) : models
  const top10Models = useMemo(
    () => [...filteredModels].sort((a, b) => (b.TURNOVER || 0) - (a.TURNOVER || 0)).slice(0, 10),
    [filteredModels]
  )

  const openMarkDrillThrough = (mark) => {
    drillThrough.open({
      title: `Заказ-наряды по марке «${cleanName(mark.MARK_NAME)}»`,
      filterString: 'MARK_ID=?',
      filterParam: [mark.MARK_ID],
    })
  }

  const openModelDrillThrough = (model) => {
    drillThrough.open({
      title: `Заказ-наряды по модели «${cleanName(model.MODEL_NAME)}»`,
      filterString: 'MODEL_ID=?',
      filterParam: [model.MODEL_ID],
    })
  }

  const openYearDrillThrough = (yearItem) => {
    drillThrough.open({
      title: `Заказ-наряды: год выпуска ${yearItem.MANUFACTURE_YEAR}`,
      filterString: 'MANUFACTURE_YEAR=?',
      filterParam: [yearItem.MANUFACTURE_YEAR],
    })
  }

  const goToModelsForMark = (mark) => {
    setMarkFilter({ id: mark.MARK_ID, name: cleanName(mark.MARK_NAME) })
    setActiveTab('models')
  }

  const periodLabel = periodsStore.selectedPeriodYm ? formatPeriodLabel(periodsStore.selectedPeriodYm) : ''

  return (
    <div className={styles.page}>
      <PageHeader title="Марки, Модели, Годы" subtitle={`Анализ автопарка — ${periodLabel}`} />

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AsyncBoundary
        isLoading={dashboardStore.isLoadingAny}
        error={dashboardStore.errorAny}
        isEmpty={!dashboardStore.isLoadingAny && marks.length === 0}
        onRetry={() => periodsStore.selectedPeriodYm && dashboardStore.load(periodsStore.selectedPeriodYm)}
      >
        {activeTab === 'marks' && (
          <div className={styles.tabContent}>
            <div className={styles.chartsRow}>
              <div className={styles.chartWrapper}>
                <h3 className={styles.chartTitle}>Доля оборота по маркам</h3>
                <PieChart
                  data={marksPieData}
                  valueFormatter={(value) => formatCurrency(value)}
                  onSliceClick={(slice) => {
                    // "Прочие" — агрегированная категория без своего MARK_ID,
                    // клик по ней намеренно ничего не делает.
                    const mark = marks.find((m) => m.MARK_NAME === slice.name)
                    if (mark) openMarkDrillThrough(mark)
                  }}
                />
              </div>
              <div className={styles.chartWrapper}>
                <h3 className={styles.chartTitle}>Средний чек по маркам</h3>
                <BarChart
                  layout="vertical"
                  data={avgCashData}
                  categoryKey="name"
                  dataKey="value"
                  label="Ср. чек"
                  valueFormatter={(value) => formatCurrency(value)}
                  onBarClick={(item) => {
                    // "Прочие" не кликабельны — нет своего MARK_ID
                    const mark = marks.find((m) => m.MARK_ID === item.MARK_ID)
                    if (mark) openMarkDrillThrough(mark)
                  }}
                />
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <h3 className={styles.tableTitle}>Детализация по маркам</h3>
              <p className={styles.tableHint}>Клик по строке — перейти к моделям этой марки</p>
              <DataTable
                columns={[
                  { key: 'MARK_NAME', header: 'Марка', render: (r) => cleanName(r.MARK_NAME) || '—' },
                  { key: 'ACCOUNT_COUNT', header: 'ЗН' },
                  { key: 'TURNOVER', header: 'Оборот', render: (r) => formatCurrency(r.TURNOVER) },
                  { key: 'ARTICLE_WORK_RATIO', header: 'Доля товаров', render: (r) => formatPercent(r.ARTICLE_WORK_RATIO) },
                  { key: 'AVG_CASH', header: 'Ср. чек', render: (r) => formatCurrency(r.AVG_CASH) },
                  { key: 'RECOMMENDED_SUMM', header: 'Рекоменд. сумма', render: (r) => formatCurrency(r.RECOMMENDED_SUMM) },
                ]}
                data={sortedMarks}
                getRowKey={(r) => r.MARK_ID}
                onRowClick={goToModelsForMark}
              />
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className={styles.tabContent}>
            {markFilter && (
              <div className={styles.filterChip}>
                Фильтр: марка «{markFilter.name}»
                <button type="button" className={styles.filterChipClear} onClick={() => setMarkFilter(null)}>
                  ✕
                </button>
              </div>
            )}

            <div className={styles.chartWrapper}>
              <h3 className={styles.chartTitle}>ТОП-10 моделей по обороту</h3>
              <BarChart
                layout="vertical"
                data={top10Models}
                categoryKey="MODEL_NAME"
                dataKey="TURNOVER"
                label="Оборот"
                valueFormatter={(value) => formatCurrency(value)}
                onBarClick={openModelDrillThrough}
              />
            </div>

            <div className={styles.tableWrapper}>
              <h3 className={styles.tableTitle}>Детализация по моделям</h3>
              <DataTable
                columns={[
                  { key: 'MODEL_NAME', header: 'Модель', render: (r) => cleanName(r.MODEL_NAME) || '—' },
                  { key: 'ACCOUNT_COUNT', header: 'ЗН' },
                  { key: 'TURNOVER', header: 'Оборот', render: (r) => formatCurrency(r.TURNOVER) },
                  { key: 'ARTICLE_WORK_RATIO', header: 'Доля товаров', render: (r) => formatPercent(r.ARTICLE_WORK_RATIO) },
                  { key: 'AVG_CASH', header: 'Ср. чек', render: (r) => formatCurrency(r.AVG_CASH) },
                ]}
                data={top10Models}
                getRowKey={(r) => r.MODEL_ID}
                onRowClick={openModelDrillThrough}
              />
            </div>
          </div>
        )}

        {activeTab === 'years' && (
          <div className={styles.tabContent}>
            <div className={styles.chartsRow}>
              <div className={styles.chartWrapper}>
                <h3 className={styles.chartTitle}>Оборот по годам</h3>
                <BarChart
                  data={years}
                  categoryKey="MANUFACTURE_YEAR"
                  dataKey="TURNOVER"
                  label="Оборот"
                  valueFormatter={(value) => formatCurrency(value)}
                  onBarClick={openYearDrillThrough}
                />
              </div>
              <div className={styles.chartWrapper}>
                <h3 className={styles.chartTitle}>Кол-во ЗН по годам</h3>
                <BarChart
                  data={years}
                  categoryKey="MANUFACTURE_YEAR"
                  dataKey="ACCOUNT_COUNT"
                  label="Кол-во ЗН"
                  valueFormatter={(value) => formatNumber(value)}
                  onBarClick={openYearDrillThrough}
                />
              </div>
            </div>
            <div className={styles.chartWrapper}>
              <h3 className={styles.chartTitle}>Средний чек по годам</h3>
              <LineChart
                data={years}
                categoryKey="MANUFACTURE_YEAR"
                dataKey="AVG_CASH"
                label="Ср. чек"
                color={CHART_COLORS.blue}
                valueFormatter={(value) => formatCurrency(value)}
              />
            </div>
          </div>
        )}
      </AsyncBoundary>

      <DrillThroughModal {...drillThrough} />
    </div>
  )
})
