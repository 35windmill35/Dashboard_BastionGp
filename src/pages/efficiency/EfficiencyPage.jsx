import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
import { getAccountList } from '@/entities/dashboard/api/dashboardApi'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import styles from './Efficiency.module.css'

export const EfficiencyPage = observer(function EfficiencyPage() {
  const navigate = useNavigate()

  // проверяем состояние загрузки
  if (dashboardStore.isLoading) {
    return <div className={styles.loading}>Загрузка данных...</div>
  }

  // проверяем ошибку
  if (dashboardStore.error) {
    return <div className={styles.error}>Ошибка: {dashboardStore.error}</div>
  }

  // получаем данные
  const kpi = dashboardStore.kpi

  // получаем данные по мастерам
  const masters = dashboardStore.mastersFiltered || []

  // данные для графика Т-фактор по мастерам
  const tFactorData = masters
    .filter((m) => m.T_FACTOR !== null && m.T_FACTOR !== undefined)
    .sort((a, b) => (b.T_FACTOR || 0) - (a.T_FACTOR || 0))

  // данные для графика Потери на ЗН по мастерам
  const wastedData = masters
    .filter((m) => m.WASTED_TIME_MIN !== null && m.WASTED_TIME_MIN !== undefined)
    .sort((a, b) => (b.WASTED_TIME_MIN || 0) - (a.WASTED_TIME_MIN || 0))

  // получаем данные по маркам
  const marks = dashboardStore.marks || []

  // сортируем по обороту по убыванию
  const sortedMarks = [...marks]
    .filter((m) => m.TURNOVER !== null && m.TURNOVER !== undefined)
    .sort((a, b) => (b.TURNOVER || 0) - (a.TURNOVER || 0))

  // если данных нет
  if (!kpi) {
    return <div className={styles.empty}>Нет данных за период</div>
  }

  // ссылки для скролла
  const tFactorRef = useRef(null)
  const wastedRef = useRef(null)
  const marksTableRef = useRef(null)

  // функция скролла к элементу с учетом высоты шапки
  const scrollToElement = (ref) => {
    if (ref.current) {
      const header = document.querySelector('.header')
      const headerHeight = header ? header.offsetHeight : 80

      const elementPosition = ref.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  // функция для drill-through, показывает список заказ-нарядов
  const handleDrillThrough = async (type, id, name) => {
    try {
      let filterString = ''
      if (type === 'мастер' || type === 'master') {
        filterString = 'MASTER_ID=?'
      } else if (type === 'марка' || type === 'mark') {
        filterString = 'MARK_ID=?'
      }

      const accounts = await getAccountList(
        periodsStore.selectedPeriodYm,
        authStore.dbIndex,
        {
          filterString: filterString,
          filterParam: [id]
        }
      )

      if (!accounts || typeof accounts !== 'object') {
        console.warn('Неожиданный формат ответа getAccountList:', accounts)
        alert(`Получен неожиданный формат данных. Сообщите лиду.\n\nТип: ${type}\nID: ${id}\nИмя: ${name}`)
        return
      }

      const accountList = Array.isArray(accounts) ? accounts : accounts.data || []

      if (accountList.length === 0) {
        alert(`Нет заказ-нарядов для ${type}: ${name}`)
        return
      }

      const message = `Заказ-наряды для ${type}: ${name}\n\n` +
        accountList.map((item, index) => 
          `${index + 1}. ${JSON.stringify(item, null, 2)}`
        ).join('\n')
      
      alert(message)

    } catch (error) {
      console.error('Ошибка при загрузке заказ-нарядов:', error)
      alert(`Ошибка при загрузке заказ-нарядов для ${type}: ${name}\n\n${error.message}`)
    }
  }

  // форматирование чисел
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('ru-RU').format(value) + '%'
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Эффективность</h1>

      {/* блок KPI */}
      <div className={styles.kpiGrid}>
        <div
          className={styles.kpiCard}
          onClick={() => scrollToElement(tFactorRef)}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.kpiLabel}>Т-фактор</span>
          <span className={styles.kpiValue}>
            {kpi.T_FACTOR !== null && kpi.T_FACTOR !== undefined
              ? kpi.T_FACTOR + '%'
              : '—'}
          </span>
          <span className={styles.kpiTooltip}>Загрузка мощностей</span>
        </div>

        <div
          className={styles.kpiCard}
          onClick={() => scrollToElement(wastedRef)}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.kpiLabel}>Потери на ЗН</span>
          <span className={styles.kpiValue}>
            {kpi.WASTED_TIME_MIN !== null && kpi.WASTED_TIME_MIN !== undefined
              ? kpi.WASTED_TIME_MIN + ' мин'
              : '—'}
          </span>
          <span className={styles.kpiTooltip}>Простой на ЗН, меньше лучше</span>
        </div>

        <div
          className={styles.kpiCard}
          onClick={() => scrollToElement(marksTableRef)}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.kpiLabel}>Аккуратность</span>
          <span className={styles.kpiValue}>
            {kpi.ACCURACY !== null && kpi.ACCURACY !== undefined
              ? kpi.ACCURACY + '%'
              : '—'}
          </span>
          <span className={styles.kpiTooltip}>Качество исполнения</span>
        </div>

        <div
          className={styles.kpiCard}
          onClick={() => navigate('/mechanics')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.kpiLabel}>Выработка</span>
          <span className={styles.kpiValue}>
            {kpi.LABOR_TIME !== null && kpi.LABOR_TIME !== undefined
              ? kpi.LABOR_TIME + ' нч'
              : '—'}
          </span>
          <span className={styles.kpiTooltip}>Суммарные нормо-часы</span>
        </div>
      </div>

      {/* графики */}
      <div className={styles.chartsRow}>
        <div className={styles.chartWrapper} ref={tFactorRef}>
          <h3 className={styles.chartTitle}>Т-фактор по мастерам</h3>
          {tFactorData.length === 0 ? (
            <p className={styles.chartEmpty}>Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={tFactorData}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => value + '%'}
                />
                <YAxis
                  type="category"
                  dataKey="MASTER_NAME"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Т-фактор']}
                  labelFormatter={(label) => `Мастер: ${label}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  }}
                  labelStyle={{
                    color: 'var(--color-text-primary)',
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="T_FACTOR"
                  fill="var(--color-accent)"
                  onClick={(data) => {
                    handleDrillThrough('мастер', data.MASTER_ID, data.MASTER_NAME)
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.chartWrapper} ref={wastedRef}>
          <h3 className={styles.chartTitle}>Потери на ЗН по мастерам</h3>
          {wastedData.length === 0 ? (
            <p className={styles.chartEmpty}>Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={wastedData}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => value + ' мин'}
                />
                <YAxis
                  type="category"
                  dataKey="MASTER_NAME"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} мин`, 'Потери']}
                  labelFormatter={(label) => `Мастер: ${label}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  }}
                  labelStyle={{
                    color: 'var(--color-text-primary)',
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="WASTED_TIME_MIN"
                  fill="var(--color-accent)"
                  onClick={(data) => {
                    handleDrillThrough('мастер', data.MASTER_ID, data.MASTER_NAME)
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* таблица Эффективность по маркам */}
      <div className={styles.tableWrapper} ref={marksTableRef}>
        <h3 className={styles.tableTitle}>Эффективность по маркам</h3>

        {sortedMarks.length === 0 ? (
          <p className={styles.tableEmpty}>Нет данных по маркам</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th title="Название марки">Марка</th>
                  <th title="Среднее время ремонта по марке">Время рем., ч</th>
                  <th title="Суммарные нормо-часы">Выработка, нч</th>
                  <th title="Загрузка мощностей">Т-фактор</th>
                  <th title="Простой на ЗН">Потери, мин</th>
                  <th title="Качество исполнения">Аккуратность, %</th>
                </tr>
              </thead>
              <tbody>
                {sortedMarks.map((mark) => (
                  <tr
                    key={mark.MARK_ID}
                    className={styles.tableRow}
                    onClick={() => {
                      handleDrillThrough('марка', mark.MARK_ID, mark.MARK_NAME)
                    }}
                  >
                    <td className={styles.markName}>{mark.MARK_NAME || '—'}</td>
                    <td>{formatNumber(mark.AVG_SERVICE_TIME)}</td>
                    <td>{formatNumber(mark.LABOR_TIME)}</td>
                    <td>{formatPercent(mark.T_FACTOR)}</td>
                    <td>{formatNumber(mark.WASTED_TIME_MIN)}</td>
                    <td>{formatPercent(mark.ACCURACY)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})