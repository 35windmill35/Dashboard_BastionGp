import type { SVGProps } from 'react'

// Мелкие инлайн-иконки для навигации сайдбара — без внешней библиотеки
// (lucide и т.п. не установлены в проект, а тащить новую зависимость ради
// пяти иконок нет смысла). Все — 20x20, stroke=currentColor, наследуют цвет
// текста ссылки.
const common: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconGrid() {
  return (
    <svg {...common}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconTrendUp() {
  return (
    <svg {...common}>
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="14 6 21 6 21 13" />
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg {...common}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M21 20c0-2.5-1.6-4.3-3.7-4.9" />
    </svg>
  )
}

export function IconWrench() {
  return (
    <svg {...common}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.83 2.83-2.83-.7-.7-2.83z" />
    </svg>
  )
}

export function IconCar() {
  return (
    <svg {...common}>
      <path d="M4 16V11l2-5h12l2 5v5" />
      <path d="M4 16h16" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  )
}
