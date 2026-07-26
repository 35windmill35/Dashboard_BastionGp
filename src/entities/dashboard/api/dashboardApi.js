import { getAuthorized } from '@/shared/api/httpClient'

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

// GET /api-v2/Dashboard/DashboardGrowingPoints/{PeriodYM}?DBIndex=...
// Путь к данным: result.Response.DashboardGrowingPoints — объект с ключами
// run/kpi/kpiPrev/monthly/masters/mastersPrev/mechanics/marks/models/years.
export async function getDashboardData(periodYm, dbIndex) {
  const { data } = await getAuthorized(`/api-v2/Dashboard/DashboardGrowingPoints/${periodYm}`, {
    params: { DBIndex: dbIndex },
  })

  return data?.DashboardGrowingPoints || null
}

// GET /api-v2/Dashboard/AccountListDashboardGrowingPoints/{PeriodYM}
// Drill-through — список заказ-нарядов, формирующих метрику (модальное
// окно детализации, см. ТЗ §4 "Drill-through"). Фильтрация — стандартным
// FilterString/FilterParam (см. общую документацию API, раздел про
// фильтры), сортировка — SortBy/SortOrder.
//
// ✅ Структура ответа проверена на реальном стенде (запрос без фильтра,
// 26.07.2026): result.Response.DashboardGrowingPointAccounts.{data,
// totalRecords}. Поля строки: ACCOUNT_ID, ACCOUNT_CODE, OWNER_NAME,
// MARK_ID/MARK_NAME, MODEL_ID/MODEL_NAME, MANUFACTURE_YEAR,
// MASTER_ID/MASTER_NAME, MAIN_MECHANIC_ID/MAIN_MECHANIC_NAME (не
// MECHANIC_ID!), SCHEDULED_TIME, LABOR_TIME, WASTED_TIME_MIN, T_FACTOR,
// SUMMA_WORK, SUMMA_ARTICLE, SUMMA, ARTICLE_WORK_RATIO, DATE_END и др.
// Как и в остальных Dashboard-ответах, значения могут быть null.
//
// Пример вызова для конкретного мастера:
// getAccountList(202606, 0, { filterString: 'MASTER_ID=?', filterParam: [123] })
//
// Для механика фильтруем по MAIN_MECHANIC_ID (в API нет отдельного поля
// MECHANIC_ID для заказ-нарядов — именно это вызывало ошибку "поле не
// принимается" при фильтрации по MECHANIC_ID).
export async function getAccountList(periodYm, dbIndex, options = {}) {
  const { filterString, filterParam, sortBy, sortOrder, fields } = options

  const { data } = await getAuthorized(
    `/api-v2/Dashboard/AccountListDashboardGrowingPoints/${periodYm}`,
    {
      params: {
        DBIndex: dbIndex,
        FilterString: filterString,
        ...(filterParam ? Object.fromEntries(filterParam.map((v, i) => [`FilterParam[${i}]`, v])) : {}),
        SortBy: sortBy,
        SortOrder: sortOrder,
        Fields: fields,
      },
    }
  )

  return data
}
