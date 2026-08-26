import { getAuthorized } from '@/shared/api/httpClient'

// Период теперь передаётся один из трёх вариантов query-параметром — раньше
// был только PERIOD_YM в пути (/DashboardGrowingPoints/{PeriodYM}), с
// 16.08.2026 бэкенд принимает ровно один из PERIOD_YM / PERIOD_YEAR /
// PERIOD_YQ query-строкой (см. переписку с Бастион). period — объект
// { type: 'month'|'quarter'|'year', value }, см. periodsStore.selectedPeriod.
function periodParams(period) {
  if (!period) return {}
  if (period.type === 'year') return { PERIOD_YEAR: period.value }
  if (period.type === 'quarter') return { PERIOD_YQ: period.value }
  return { PERIOD_YM: period.value }
}

// GET /api-v2/Dashboard/DashboardGrowingPointsPeriods?DBIndex=...
// Реальный путь к данным (проверено на стенде, отличается от ТЗ):
// result.Response.DashboardGrowingPointPeriods.data — массив периодов.
export async function getPeriods(dbIndex) {
  const { data } = await getAuthorized('/api-v2/Dashboard/DashboardGrowingPointsPeriods', {
    params: {
      DBIndex: dbIndex,
      SortBy: 'PERIOD_YM',
      SortOrder: 1,
    },
  })

  return data?.DashboardGrowingPointPeriods?.data || []
}

// GET /api-v2/Dashboard/DashboardGrowingPoints?DBIndex=...&PERIOD_YM=...
// Путь к данным: result.Response.DashboardGrowingPoints — объект с ключами
// run/kpi/kpiPrev/monthly/masters/mastersPrev/mechanics/marks/models/years.
export async function getDashboardData(period, dbIndex) {
  const { data } = await getAuthorized('/api-v2/Dashboard/DashboardGrowingPoints', {
    params: { DBIndex: dbIndex, ...periodParams(period) },
  })

  return data?.DashboardGrowingPoints || null
}

// GET /api-v2/Dashboard/AccountListDashboardGrowingPoints?PERIOD_YM=...
// Drill-through — список заказ-нарядов, формирующих метрику (модальное
// окно детализации, см. ТЗ §4 "Drill-through"). Фильтрация — стандартным
// FilterString/FilterParam (см. общую документацию API, раздел про
// фильтры), сортировка — SortBy/SortOrder.
//
// ✅ Структура ответа проверена на реальном стенде (запрос без фильтра,
// 26.07.2026, уточнено 11.08.2026): result.Response.DashboardGrowingPointAccounts.{data,
// totalRecords}. Поля строки: ACCOUNT_ID, ACCOUNT_CODE, OWNER_NAME,
// MARK_ID/MARK_NAME, MODEL_ID/MODEL_NAME, MANUFACTURE_YEAR,
// MASTER_ID/MASTER_NAME, MAIN_MECHANIC_ID/MAIN_MECHANIC_NAME (не
// MECHANIC_ID!), SCHEDULED_TIME, LABOR_TIME, WASTED_TIME_MIN, T_FACTOR,
// SUMMA_WORK, SUMMA_ARTICLE, SUMMA, ARTICLE_WORK_RATIO, DATE_END и др.
// Как и в остальных Dashboard-ответах, значения могут быть null.
//
// SERVICE_TIME_TO_CALC — фактическое время ремонта в часах (то самое,
// из чего считается T_FACTOR относительно LABOR_TIME); часто null, если
// заказ-наряд ещё не закрыт корректно. CARELESS_BILL — флаг "!" на
// неаккуратно закрытом ЗН, иначе null — это и есть Аккуратность на
// уровне отдельного заказ-наряда.
//
// Пример вызова для конкретного мастера:
// getAccountList({ type: 'month', value: 202606 }, 0, { filterString: 'MASTER_ID=?', filterParam: [123] })
//
// Для механика фильтруем по MAIN_MECHANIC_ID (в API нет отдельного поля
// MECHANIC_ID для заказ-нарядов — именно это вызывало ошибку "поле не
// принимается" при фильтрации по MECHANIC_ID).
export async function getAccountList(period, dbIndex, options = {}) {
  const { filterString, filterParam, sortBy, sortOrder, fields } = options

  const { data } = await getAuthorized('/api-v2/Dashboard/AccountListDashboardGrowingPoints', {
    params: {
      DBIndex: dbIndex,
      ...periodParams(period),
      FilterString: filterString,
      ...(filterParam ? Object.fromEntries(filterParam.map((v, i) => [`FilterParam[${i}]`, v])) : {}),
      SortBy: sortBy,
      SortOrder: sortOrder,
      Fields: fields,
    },
  })

  return data
}
