import type { ReactNode } from 'react'
import styles from './Tooltip.module.css'

interface TooltipProps {
  text?: string
  children: ReactNode
}

// Простая CSS-подсказка без доп. библиотек позиционирования (см. ТЗ:
// "Tooltip — всплывающая подсказка при наведении: значение + пояснение +
// дельта"). Оборачиваем любой элемент (KPI-карточку, ячейку таблицы,
// точку графика-обёртку) — подсказка всплывает сверху по hover/focus.
//
// Пример: <Tooltip text="Суммарный оборот за месяц"><KpiCard .../></Tooltip>
//
// Обёртка — <div>, а не <span>: children часто оказывается блочным
// элементом (например, <div> карточки KpiCard), а <div> внутри <span>
// невалиден по спецификации HTML (span — только "phrasing content") и
// браузер непредсказуемо перестраивает разметку. <div> принимает и
// блочные, и строчные потомки, поэтому безопасен в обоих случаях.
export function Tooltip({ text, children }: TooltipProps) {
  if (!text) return children

  return (
    <div className={styles.wrapper} tabIndex={0}>
      {children}
      <div className={styles.bubble} role="tooltip">
        {text}
      </div>
    </div>
  )
}
