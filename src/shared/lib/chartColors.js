// Recharts рисует в SVG и не всегда надёжно резолвит var(--color-*) в
// атрибутах (зависит от браузера/экспорта в PNG и т.п.) — поэтому для
// графиков держим отдельную JS-палитру. Значения ПРОДУБЛИРОВАНЫ из
// app/styles/theme.css (тёмная тема) — если меняете тему, обновите и
// здесь тоже.
export const CHART_COLORS = {
  accent: '#4a7dff',
  positive: '#3ddc84',
  negative: '#ff5c5c',
  text: '#f2f2f3',
  textSecondary: '#9a9aa2',
  border: '#3a3a3c',
  grid: '#2a2a2d',
}

// Палитра для многосерийных/многосекторных графиков (пирог по маркам и т.п.)
export const CHART_PALETTE = [
  '#4a7dff',
  '#3ddc84',
  '#ffb84a',
  '#ff5c5c',
  '#a874ff',
  '#4ad0ff',
  '#ff7ab8',
  '#c9d94a',
  '#7a8cff',
  '#9a9aa2', // "Прочие" — последний, серый
]
