// Единые утилиты форматирования чисел и строк (ТЗ §5: ru-RU, пробел —
// разделитель тысяч, ₽ без копеек в KPI). Использовать только эти функции,
// не форматировать числа вручную в компонентах — иначе разъедется формат
// между экранами разных разработчиков.

const NBSP = ' '

function isEmpty(value) {
  return value === null || value === undefined || Number.isNaN(value)
}

// 12345 -> "12 345". null/undefined -> "—"
export function formatNumber(value, { decimals = 0 } = {}) {
  if (isEmpty(value)) return '—'

  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(value)
    .replace(/ /g, ' ')
}

// 7139850 -> "7 139 850 ₽" (без копеек, как того требует ТЗ для KPI)
export function formatCurrency(value) {
  if (isEmpty(value)) return '—'
  return `${formatNumber(value, { decimals: 0 })}${NBSP}₽`
}

// 38 -> "38%"
export function formatPercent(value, { decimals = 0 } = {}) {
  if (isEmpty(value)) return '—'
  return `${formatNumber(value, { decimals })}%`
}

// 1424 -> "1 424 нч"
export function formatHours(value) {
  if (isEmpty(value)) return '—'
  return `${formatNumber(value)}${NBSP}нч`
}

// 4.7 -> "4,7 ч"
export function formatServiceTime(value) {
  if (isEmpty(value)) return '—'
  return `${formatNumber(value, { decimals: 1 })}${NBSP}ч`
}

// 55 -> "55 мин"
export function formatMinutes(value) {
  if (isEmpty(value)) return '—'
  return `${formatNumber(value)}${NBSP}мин`
}

// Δ = (cur - prev) / prev. Возвращает null, если посчитать нельзя
// (prev пустой/0) — компонент должен показать "—", а не 0%/Infinity.
export function calcDelta(cur, prev) {
  if (isEmpty(cur) || isEmpty(prev) || prev === 0) return null
  return (cur - prev) / prev
}

// 0.134 -> "+13%", -0.05 -> "−5%". higherIsBetter=false — для метрик,
// где меньше = лучше (напр. WASTED_TIME_MIN), меняет цвет-семантику,
// но не сам знак числа.
export function formatDelta(delta, { decimals = 0 } = {}) {
  if (isEmpty(delta)) return '—'
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return `${sign}${formatNumber(Math.abs(delta) * 100, { decimals })}%`
}

// true — дельта "хорошая" (зелёная), false — "плохая" (красная), null — нейтральная
export function isDeltaPositive(delta, { higherIsBetter = true } = {}) {
  if (isEmpty(delta) || delta === 0) return null
  const isIncrease = delta > 0
  return higherIsBetter ? isIncrease : !isIncrease
}

// "Смурыгин  Евгений Михайлович " -> "Смурыгин Евгений Михайлович"
// (данные из API иногда приходят с лишними пробелами, см. заметки по API)
export function cleanName(value) {
  if (!value) return ''
  return String(value).trim().replace(/\s+/g, ' ')
}
