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
// Пример вызова для конкретного мастера:
// getAccountList(202606, 0, { filterString: 'MASTER_ID=?', filterParam: [123] })
//
// ⚠ Структура ответа этого метода ещё не проверялась на реальном стенде
// (см. открытые вопросы в заметках по API) — путь к данным ниже (data.*)
// предположительный по аналогии с другими Dashboard/* методами и может
// потребовать правки после первого реального запроса.
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
