// Recharts рисует в SVG и не всегда надёжно резолвит var(--color-*) в
// атрибутах (зависит от браузера/экспорта в PNG и т.п.) — поэтому для
// графиков держим отдельную JS-палитру. Раньше значения были захардкожены
// под тёмную тему (продублированы из theme.css) — из-за этого в светлой
// теме оси/сетка графиков и фон тултипа оставались тёмными навсегда, а
// текст (который берёт цвет из --color-text и в светлой теме становится
// тёмным) рисовался поверх тоже тёмного фона тултипа — получался тёмный
// текст на тёмном фоне. Вместо хардкода читаем реальные значения
// CSS-переменных темы через getComputedStyle — тогда палитра графиков
// совпадает с той темой, что была активна при загрузке страницы (тема
// определяется системной настройкой prefers-color-scheme, см. theme.css,
// в рантайме не переключается — читать переменные один раз при загрузке
// модуля достаточно).
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export const CHART_COLORS = {
  accent: cssVar('--color-accent', '#f5a623'),
  positive: cssVar('--color-positive', '#22c55e'),
  negative: cssVar('--color-negative', '#ef4444'),
  blue: cssVar('--color-chart-blue', '#38bdf8'),
  purple: cssVar('--color-chart-purple', '#c084fc'),
  text: cssVar('--color-text', '#f4f4f5'),
  textSecondary: cssVar('--color-text-secondary', '#97979f'),
  border: cssVar('--color-border', '#2a2a2f'),
  grid: cssVar('--color-border', '#2a2a2f'),
  surface: cssVar('--color-surface', '#1f1f23'),
}

// Палитра для многосерийных/многосекторных графиков (пирог по маркам и т.п.)
export const CHART_PALETTE = [
  '#f5a623',
  '#38bdf8',
  '#22c55e',
  '#c084fc',
  '#ef4444',
  '#22d3ee',
  '#f472b6',
  '#a3e635',
  '#818cf8',
  '#97979f', // "Прочие" — последний, серый
]
