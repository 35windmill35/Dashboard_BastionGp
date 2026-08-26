const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

// PERIOD_YM приходит как число вида 202606 (год*100+месяц).
// Готового человекочитаемого label сервер не отдаёт (см. заметки по API) —
// формируем сами: "Июнь 2026".
export function formatPeriodLabel(periodYm: number): string {
  const year = Math.floor(periodYm / 100)
  const month = periodYm % 100
  const name = MONTH_NAMES[month - 1] || '?'
  return `${name} ${year}`
}

const MONTH_SHORT = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
]

// Короткая подпись для осей графиков "за 12 мес" — сервер отдаёт MONTH_LABEL
// по-английски (Jun.25), просим русский: "Июн 25"
export function formatMonthShortLabel(periodYm: number): string {
  const year = Math.floor(periodYm / 100)
  const month = periodYm % 100
  const name = MONTH_SHORT[month - 1] || '?'
  return `${name} ${String(year).slice(-2)}`
}

// PERIOD_YM=202606 -> 20262 (год*10 + номер квартала). Формат PERIOD_YQ
// подтверждён бэкендом 16.08.2026 — параметр запроса для фильтра по кварталу.
export function periodYmToYq(periodYm: number): number {
  const year = Math.floor(periodYm / 100)
  const month = periodYm % 100
  const quarter = Math.ceil(month / 3)
  return year * 10 + quarter
}

// PERIOD_YM=202606 -> 2026
export function periodYmToYear(periodYm: number): number {
  return Math.floor(periodYm / 100)
}

// 20262 -> "2 квартал 2026"
export function formatQuarterLabel(periodYq: number): string {
  const year = Math.floor(periodYq / 10)
  const quarter = periodYq % 10
  return `${quarter} квартал ${year}`
}

// 2026 -> "2026 год"
export function formatYearLabel(year: number): string {
  return `${year} год`
}

export type PeriodMode = 'month' | 'quarter' | 'year'

// Дательный падеж режима периода — для фраз "к прошлому/предыдущему ...".
// Единое место вместо одинакового switch на каждом экране с KPI-дельтами.
export function periodModeDative(periodMode: PeriodMode): string {
  if (periodMode === 'year') return 'году'
  if (periodMode === 'quarter') return 'кварталу'
  return 'месяцу'
}

// Строка тренда (monthly[]) — с 18.08.2026 бэкенд кладёт то месяцы, то
// кварталы, то года в зависимости от periodMode (см. formatTrendLabel).
export interface TrendPoint {
  PERIOD_TYPE?: 'M' | 'Q' | 'Y'
  PERIOD_YM?: number
  PERIOD_YQ?: number
  PERIOD_YEAR?: number
  [key: string]: unknown
}

// Короткая подпись для оси графиков-трендов на Обзоре. С 18.08.2026
// бэкенд кладёт в monthly[] то месяцы, то кварталы, то года — смотря какой
// periodMode выбран (см. periodsStore.selectedPeriod) — поэтому формат
// подписи зависит от PERIOD_TYPE конкретной строки, а не всегда PERIOD_YM.
export function formatTrendLabel(item: TrendPoint): string {
  if (item.PERIOD_TYPE === 'Y') return String(item.PERIOD_YEAR)
  if (item.PERIOD_TYPE === 'Q') {
    const year = Math.floor((item.PERIOD_YQ as number) / 10)
    const quarter = (item.PERIOD_YQ as number) % 10
    return `${quarter}кв.${String(year).slice(-2)}`
  }
  return formatMonthShortLabel(item.PERIOD_YM as number)
}
