import { TrendUpIcon, TrendDownIcon } from './TrendArrow'
import { ListIcon } from './icons'
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
// onClick — drill-down (переход/скролл на связанный график, см. ТЗ, колонка
// «Drill-down»). onDrillThrough — отдельная, независимая кнопка-иконка в
// углу карточки: открывает модалку со списком ЗН (ТЗ, колонка
// «Drill-through»). Оба клика на карточке не мешают друг другу — клик по
// иконке останавливает всплытие (stopPropagation), чтобы не сработал onClick.
//
// Пример:
// <KpiCard
//   title="Оборот"
//   value={formatCurrency(kpi.TURNOVER)}
//   delta={formatDelta(calcDelta(kpi.TURNOVER, kpiPrev.TURNOVER))}
//   deltaPositive={isDeltaPositive(calcDelta(kpi.TURNOVER, kpiPrev.TURNOVER))}
//   tooltip="Суммарный оборот за месяц"
//   onClick={() => navigate('/masters')}
//   onDrillThrough={() => drillThrough.open({ title: 'Список ЗН за период' })}
// />
export function KpiCard({
  title,
  value,
  delta,
  deltaPositive = null,
  // Текст после дельты — "к прошлому месяцу" по умолчанию, но при выборе
  // квартала/года в комбобоксе периода нужно "к прошлому кварталу"/"году"
  // (см. periodsStore.periodMode), иначе подпись врёт про месяц.
  deltaSuffix = 'к прошлому месяцу',
  tooltip,
  onClick,
  onDrillThrough,
}) {
  const isClickable = typeof onClick === 'function'
  const hasDrillThrough = typeof onDrillThrough === 'function'
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
      {hasDrillThrough && (
        <button
          type="button"
          className={styles.drillThroughBtn}
          title="Список заказ-нарядов"
          aria-label="Список заказ-нарядов"
          onClick={(e) => {
            e.stopPropagation()
            onDrillThrough(e)
          }}
        >
          <ListIcon />
        </button>
      )}
      <div className={styles.title}>{title}</div>
      <div className={styles.value}>{value}</div>
      {hasDelta && (
        <div
          className={`${styles.delta} ${
            deltaPositive === true ? styles.positive : deltaPositive === false ? styles.negative : ''
          }`}
        >
          {ArrowIcon && <ArrowIcon />} {delta} {deltaSuffix}
        </div>
      )}
      {tooltip && <div className={styles.caption}>{tooltip}</div>}
    </div>
  )
}
