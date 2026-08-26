import type { SVGProps } from 'react'

// Стрелки роста/падения для дельты в KpiCard — вместо текстовых символов
// ↗/↘ (те выглядели мелко и не всегда одинаково рендерились шрифтом ОС).
// currentColor — наследует цвет из .positive/.negative в KpiCard.module.css.
const common: SVGProps<SVGSVGElement> = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function TrendUpIcon() {
  return (
    <svg {...common}>
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="14 6 21 6 21 13" />
    </svg>
  )
}

export function TrendDownIcon() {
  return (
    <svg {...common}>
      <polyline points="3 7 9 13 13 9 21 18" />
      <polyline points="21 11 21 18 14 18" />
    </svg>
  )
}
