import type { SVGProps } from 'react'

const common: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function WarningIcon() {
  return (
    <svg {...common}>
      <path d="M12 3.5 21.5 20h-19L12 3.5z" />
      <line x1="12" y1="9.5" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12" y2="17.1" />
    </svg>
  )
}

export function CheckIcon() {
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12.5 11 15.5 16 9" />
    </svg>
  )
}
