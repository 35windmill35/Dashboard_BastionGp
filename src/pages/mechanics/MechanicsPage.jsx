// src/pages/mechanics/MechanicsPage.jsx
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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import styles from './Mechanics.module.css'

export const MechanicsPage = observer(function MechanicsPage() {
  // проверяем состояние загрузки
  if (dashboardStore.isLoading) {
    return <div className={styles.loading}>Загрузка данных...</div>
  }

  // проверяем ошибку
  if (dashboardStore.error) {
    return <div className={styles.error}>Ошибка: {dashboardStore.error}</div>
  }

  // получаем данные по механикам
  const mechanics = dashboardStore.mechanicsFiltered || []

  // если данных нет
  if (mechanics.length === 0) {
    return <div className={styles.empty}>Нет данных за период</div>
  }

  // считаем KPI на фронте
  const mechanicCount = mechanics.length

  const totalTurnover = mechanics.reduce(
    (sum, m) => sum + (m.TURNOVER || 0),
    0
  )

  const validAccount = mechanics.filter((m) => m.ACCOUNT_COUNT !== null)
  const avgAccount =
    validAccount.length > 0
      ? validAccount.reduce((sum, m) => sum + m.ACCOUNT_COUNT, 0) /
        validAccount.length
      : 0

  const validAccuracy = mechanics.filter((m) => m.ACCURACY !== null)
  const avgAccuracy =
    validAccuracy.length > 0
      ? validAccuracy.reduce((sum, m) => sum + m.ACCURACY, 0) /
        validAccuracy.length
      : 0

  // подготовка данных для графика Оборот по механикам
  const turnoverData = mechanics
    .filter((m) => m.TURNOVER !== null && m.TURNOVER !== undefined)
    .sort((a, b) => (b.TURNOVER || 0) - (a.TURNOVER || 0))

  // подготовка данных для scatter графика
  const scatterData = mechanics
    .filter(
      (m) =>
        m.WASTED_TIME_MIN !== null &&
        m.WASTED_TIME_MIN !== undefined &&
        m.ACCURACY !== null &&
        m.ACCURACY !== undefined
    )
    .map((m) => ({
      name: m.MECHANIC_NAME,
      x: m.WASTED_TIME_MIN,
      y: m.ACCURACY,
      id: m.MECHANIC_ID,
    }))

  // функция для drill-through, показывает список заказ-нарядов
  const handleDrillThrough = async (type, id, name) => {
    try {
      const accounts = await getAccountList(
        periodsStore.selectedPeriodYm,
        authStore.dbIndex,
        {
          filterString: 'MECHANIC_ID=?',
          filterParam: [id]
        }
      )

      if (!accounts || typeof accounts !== 'object') {
        console.warn('Неожиданный формат ответа getAccountList:', accounts)
        alert(`Для ${type} "${name}" данные временно недоступны.`)
        return
      }

      const accountList = Array.isArray(accounts) ? accounts : accounts.data || []

      if (accountList.length === 0) {
        alert(`Для ${type} "${name}" нет заказ-нарядов за выбранный период.`)
        return
      }

      const message = `Заказ-наряды для ${type}: ${name}\n\n` +
        accountList.map((item, index) => 
          `${index + 1}. ${JSON.stringify(item, null, 2)}`
        ).join('\n')
      
      alert(message)

    } catch (error) {
      // TODO: Убрать заглушку, когда API getAccountList начнёт принимать MECHANIC_ID
      console.error('Ошибка при загрузке заказ-нарядов:', error)
      alert(`Для ${type} "${name}" данные временно недоступны.`)
    }
  }

  // кастомный тултип для scatter графика
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
            {data.name}
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: 13 }}>
            Потери: {formatNumber(data.x)} мин
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: 13 }}>
            Аккуратность: {formatNumber(data.y)}%
          </p>
        </div>
      )
    }
    return null
  }

  // форматирование чисел
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  const formatMoney = (value) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('ru-RU').format(value) + '%'
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Механики</h1>

      {/* блок KPI */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Механиков</span>
          <span className={styles.kpiValue}>{mechanicCount}</span>
          <span className={styles.kpiTooltip}>Число механиков с ЗН</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Суммарный оборот</span>
          <span className={styles.kpiValue}>{formatMoney(totalTurnover)} ₽</span>
          <span className={styles.kpiTooltip}>Оборот по всем механикам</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Среднее ЗН</span>
          <span className={styles.kpiValue}>{formatNumber(avgAccount)}</span>
          <span className={styles.kpiTooltip}>Среднее число ЗН на механика</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Средняя аккуратность</span>
          <span className={styles.kpiValue}>{formatPercent(avgAccuracy)}</span>
          <span className={styles.kpiTooltip}>Средняя по механикам</span>
        </div>
      </div>

      {/* графики */}
      <div className={styles.chartsRow}>
        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>Оборот по механикам</h3>
          {turnoverData.length === 0 ? (
            <p className={styles.chartEmpty}>Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={turnoverData}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatMoney(value)}
                />
                <YAxis
                  type="category"
                  dataKey="MECHANIC_NAME"
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${formatMoney(value)} ₽`, 'Оборот']}
                  labelFormatter={(label) => `Механик: ${label}`}
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
                  dataKey="TURNOVER"
                  fill="var(--color-accent)"
                  onClick={(data) => {
                    handleDrillThrough('механик', data.MECHANIC_ID, data.MECHANIC_NAME)
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>Потери vs Аккуратность</h3>
          {scatterData.length === 0 ? (
            <p className={styles.chartEmpty}>Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Потери"
                  label={{
                    value: 'Потери, мин',
                    position: 'bottom',
                    fill: 'var(--color-text-secondary)',
                  }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Аккуратность"
                  label={{
                    value: 'Аккуратность, %',
                    angle: -90,
                    position: 'left',
                    fill: 'var(--color-text-secondary)',
                  }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter
                  data={scatterData}
                  fill="var(--color-accent)"
                  shape="circle"
                  onClick={(data) => {
                    handleDrillThrough('механик', data.id, data.name)
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
          <p className={styles.scatterNote}>
            Оптимум — левый верх, меньше потерь, выше аккуратность
          </p>
        </div>
      </div>

      {/* таблица механиков */}
      <div className={styles.tableWrapper}>
        <h3 className={styles.tableTitle}>Полная таблица механиков</h3>

        {mechanics.length === 0 ? (
          <p className={styles.tableEmpty}>Нет данных</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th title="Имя механика">Механик</th>
                  <th title="Количество заказ-нарядов">ЗН</th>
                  <th title="Оборот">Оборот, ₽</th>
                  <th title="Средний чек">Ср. чек, ₽</th>
                  <th title="Доля работы по статье">Доля работы</th>
                  <th title="Среднее время ремонта">Время рем., ч</th>
                  <th title="Суммарные нормо-часы">Выработка, нч</th>
                  <th title="Загрузка мощностей">Т-фактор</th>
                  <th title="Простой на ЗН">Потери, мин</th>
                  <th title="Качество исполнения">Аккуратность, %</th>
                </tr>
              </thead>
              <tbody>
                {mechanics.map((mechanic) => (
                  <tr
                    key={mechanic.MECHANIC_ID}
                    className={styles.tableRow}
                    onClick={() => {
                      handleDrillThrough('механик', mechanic.MECHANIC_ID, mechanic.MECHANIC_NAME)
                    }}
                  >
                    <td className={styles.mechanicName}>
                      {mechanic.MECHANIC_NAME || '—'}
                    </td>
                    <td>{formatNumber(mechanic.ACCOUNT_COUNT)}</td>
                    <td>{formatMoney(mechanic.TURNOVER)}</td>
                    <td>{formatMoney(mechanic.AVG_CASH)}</td>
                    <td>{formatPercent(mechanic.ARTICLE_WORK_RATIO)}</td>
                    <td>{formatNumber(mechanic.AVG_SERVICE_TIME)}</td>
                    <td>{formatNumber(mechanic.LABOR_TIME)}</td>
                    <td>{formatPercent(mechanic.T_FACTOR)}</td>
                    <td>{formatNumber(mechanic.WASTED_TIME_MIN)}</td>
                    <td>{formatPercent(mechanic.ACCURACY)}</td>
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