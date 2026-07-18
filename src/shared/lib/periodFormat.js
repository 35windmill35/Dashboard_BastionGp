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
export function formatPeriodLabel(periodYm) {
  const year = Math.floor(periodYm / 100)
  const month = periodYm % 100
  const name = MONTH_NAMES[month - 1] || '?'
  return `${name} ${year}`
}
