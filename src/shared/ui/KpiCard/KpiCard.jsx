import { TrendUpIcon, TrendDownIcon } from './TrendArrow'
import styles from './KpiCard.module.css'

// Карточка KPI (см. ТЗ §4.1 и аналогичные разделы на других экранах, вид —
// под референс из ТЗ https://tochki-rosta.pplx.app): uppercase-лейбл,
// крупное значение, дельта со стрелкой к прошлому месяцу, мелкая серая
// подпись снизу (раньше был hover-тултип — в референсе это всегда видимый
// текст, поэтому строку с описанием сделали постоянной, а не по ховеру).
//
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
  const hasDelta = delta !== undefined && delta !== null && delta !== '—'
  // Стрелка отражает направление самого изменения (рост/падение), а не
  // "хорошо/плохо" — эти два понятия расходятся для метрик вида "меньше
  // лучше" (higherIsBetter: false), где отрицательное изменение зелёное.
  const ArrowIcon = hasDelta
    ? delta.startsWith('+')
      ? TrendUpIcon
      : delta.startsWith('−') || delta.startsWith('-')
        ? TrendDownIcon
        : null
    : null

  return (
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
      {hasDelta && (
        <div
          className={`${styles.delta} ${
            deltaPositive === true ? styles.positive : deltaPositive === false ? styles.negative : ''
          }`}
        >
          {ArrowIcon && <ArrowIcon />} {delta} к прошлому месяцу
        </div>
      )}
      {tooltip && <div className={styles.caption}>{tooltip}</div>}
    </div>
  )
}
