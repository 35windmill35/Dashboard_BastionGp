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
