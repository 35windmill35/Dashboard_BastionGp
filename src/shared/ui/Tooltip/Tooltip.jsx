import styles from './Tooltip.module.css'

// Простая CSS-подсказка без доп. библиотек позиционирования (см. ТЗ:
// "Tooltip — всплывающая подсказка при наведении: значение + пояснение +
// дельта"). Оборачиваем любой элемент (KPI-карточку, ячейку таблицы,
// точку графика-обёртку) — подсказка всплывает сверху по hover/focus.
//
// Пример: <Tooltip text="Суммарный оборот за месяц"><KpiCard .../></Tooltip>
export function Tooltip({ text, children }) {
  if (!text) return children

  return (
    <span className={styles.wrapper} tabIndex={0}>
      {children}
      <span className={styles.bubble} role="tooltip">
        {text}
      </span>
    </span>
  )
}
