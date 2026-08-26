import type { PeriodMode, TrendPoint } from '@/shared/lib/periodFormat'

// Единый "период" — тип режима (месяц/квартал/год) + конкретное значение
// (PERIOD_YM/PERIOD_YQ/PERIOD_YEAR соответственно). См. periodsStore.selectedPeriod
// и dashboardApi.periodParams.
export interface Period {
  type: PeriodMode
  value: number
}

// Строка из списка периодов (DashboardGrowingPointsPeriods) — может быть
// месяцем, кварталом или годом (PERIOD_TYPE 'M'/'Q'/'Y').
export interface PeriodRow extends TrendPoint {
  PERIOD_TYPE: 'M' | 'Q' | 'Y'
}

export interface PeriodOption {
  value: number
  label: string
}

// Общая "метрическая" строка дашборда — используется и для kpi/kpiPrev
// (единственный объект), и для строк таблиц (masters/mechanics/marks/
// models/years) — набор полей у них пересекается, но не совпадает
// полностью, поэтому все поля опциональны + есть индексная сигнатура на
// случай ещё не описанных полей ответа API.
export interface MetricRow {
  ACCOUNT_COUNT?: number | null
  ACCURACY?: number | null
  ARTICLE_WORK_RATIO?: number | null
  AVG_CASH?: number | null
  AVG_SERVICE_TIME?: number | null
  LABOR_TIME?: number | null
  TURNOVER?: number | null
  TURNOVER_SHARE?: number | null
  T_FACTOR?: number | null
  WASTED_TIME_MIN?: number | null
  RECOMMENDED_SUMM?: number | null
  SUMMA?: number | null
  MASTER_ID?: number
  MASTER_NAME?: string
  MECHANIC_ID?: number
  MECHANIC_NAME?: string
  MARK_ID?: number
  MARK_NAME?: string
  MODEL_ID?: number
  MODEL_NAME?: string
  MANUFACTURE_YEAR?: number
  [key: string]: unknown
}

// Строка monthly[] — метрики + подпись периода (PERIOD_TYPE/PERIOD_YM/
// PERIOD_YQ/PERIOD_YEAR, см. formatTrendLabel) + MONTH_LABEL, переписанный
// на русский на клиенте (см. dashboardStore.monthly).
export interface TrendRow extends MetricRow, TrendPoint {
  MONTH_LABEL?: string
}

// result.Response.DashboardGrowingPoints — см. dashboardApi.getDashboardData.
export interface DashboardData {
  run?: unknown
  kpi?: MetricRow | null
  kpiPrev?: MetricRow | null
  monthly?: TrendRow[]
  masters?: MetricRow[]
  mastersPrev?: MetricRow[]
  mechanics?: MetricRow[]
  marks?: MetricRow[]
  models?: MetricRow[]
  years?: MetricRow[]
  [key: string]: unknown
}

// Строка заказ-наряда из AccountListDashboardGrowingPoints (drill-through),
// см. dashboardApi.getAccountList.
export interface AccountRow {
  ACCOUNT_ID?: number
  ACCOUNT_CODE?: string
  OWNER_NAME?: string
  MARK_ID?: number
  MARK_NAME?: string
  MODEL_ID?: number
  MODEL_NAME?: string
  MANUFACTURE_YEAR?: number
  MASTER_ID?: number
  MASTER_NAME?: string
  MAIN_MECHANIC_ID?: number
  MAIN_MECHANIC_NAME?: string
  SCHEDULED_TIME?: number | null
  LABOR_TIME?: number | null
  WASTED_TIME_MIN?: number | null
  T_FACTOR?: number | null
  SUMMA_WORK?: number | null
  SUMMA_ARTICLE?: number | null
  SUMMA?: number | null
  ARTICLE_WORK_RATIO?: number | null
  SERVICE_TIME_TO_CALC?: number | null
  CARELESS_BILL?: string | null
  DATE_END?: string | null
  [key: string]: unknown
}

// result.Response целиком — сам список лежит на вложенном ключе
// DashboardGrowingPointAccounts (см. dashboardApi.getAccountList).
export interface AccountListResult {
  DashboardGrowingPointAccounts?: {
    data?: AccountRow[]
    totalRecords?: number
  }
  [key: string]: unknown
}
