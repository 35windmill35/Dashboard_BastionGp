import { observer } from 'mobx-react-lite'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'

// Временная отладочная версия страницы — показывает сырые данные из
// сторов, чтобы проверить всю цепочку логин → сессия → периоды → данные.
// Настоящий UI (KPI-карточки, графики) будет сделан на Этапе 3.
export const OverviewPage = observer(function OverviewPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Обзор (отладочный вид)</h1>

      <p>Автоцентр: {authStore.currentFirm?.FIRM_SHORT_NAME || '—'}</p>

      <p>
        Период:{' '}
        {periodsStore.isLoading ? (
          'загрузка списка периодов…'
        ) : (
          <select
            value={periodsStore.selectedPeriodYm || ''}
            onChange={(e) => periodsStore.setSelectedPeriod(Number(e.target.value))}
          >
            {periodsStore.periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </p>

      {periodsStore.error && <p style={{ color: 'tomato' }}>{periodsStore.error}</p>}

      <h2>KPI за период</h2>
      {dashboardStore.isLoading && <p>Загрузка данных дашборда…</p>}
      {dashboardStore.error && <p style={{ color: 'tomato' }}>{dashboardStore.error}</p>}
      {dashboardStore.kpi && (
        <pre style={{ background: '#111', padding: 12, borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify(dashboardStore.kpi, null, 2)}
        </pre>
      )}
    </div>
  )
})
