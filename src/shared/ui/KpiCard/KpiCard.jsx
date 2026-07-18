import { Tooltip } from '@/shared/ui/Tooltip/Tooltip'
import styles from './KpiCard.module.css'

// Карточка KPI (см. ТЗ §4.1 и аналогичные разделы на других экранах).
// Значение и дельту форматирует вызывающий код через @/shared/lib/formatters
// (formatCurrency/formatPercent/calcDelta/formatDelta/isDeltaPositive) —
// KpiCard сам ничего не форматирует, только отображает готовые строки.
//
// Пример:
// <KpiCard
//   title="Оборот"
//   value={formatCurrency(kpi.TURNOVER)}
//   delta={formatDelta(calcDelta(kpi.TURNOVER, kpiPrev.TURNOVER))}
//   deltaPositive={isDeltaPositive(calcDelta(kpi.TURNOVER, kpiPrev.TURNOVER))}
//   tooltip="Суммарный оборот за месяц"
//   onClick={() => navigate('/masters')}
// />
export function KpiCard({ title, value, delta, deltaPositive = null, tooltip, onClick }) {
  const isClickable = typeof onClick === 'function'

  const card = (
    <div
      className={`${styles.card} ${isClickable ? styles.clickable : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(e)
            }
          : undefined
      }
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      {delta !== undefined && delta !== null && (
        <div
          className={`${styles.delta} ${
            deltaPositive === true ? styles.positive : deltaPositive === false ? styles.negative : ''
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  )

  return tooltip ? <Tooltip text={tooltip}>{card}</Tooltip> : card
}
