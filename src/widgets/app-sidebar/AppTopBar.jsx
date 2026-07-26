import { observer } from 'mobx-react-lite'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import styles from './AppTopBar.module.css'

// Узкая полоса фильтров над контентом: автоцентр (скрыт, если база одна),
// период, выход. В референсе (ТЗ) это отдельный, визуально лёгкий блок —
// не часть сайдбара и не полноразмерная шапка. id стабильный (в отличие от
// хэшированного CSS-модуль класса) — используется для расчёта высоты при
// скролле к якорю (см. EfficiencyPage.jsx, scrollToElement).
export const AppTopBar = observer(function AppTopBar() {
  return (
    <div id="app-header" className={styles.bar}>
      {authStore.firms.length > 1 ? (
        <select
          className={styles.select}
          value={authStore.dbIndex}
          onChange={(e) => authStore.setDbIndex(Number(e.target.value))}
        >
          {authStore.firms.map((firm, index) => (
            <option key={index} value={index}>
              {firm.FIRM_SHORT_NAME}
            </option>
          ))}
        </select>
      ) : (
        <span className={styles.firmName}>{authStore.currentFirm?.FIRM_SHORT_NAME}</span>
      )}

      {periodsStore.periodOptions.length > 0 && (
        <select
          className={styles.select}
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

      <button className={styles.logout} type="button" onClick={() => authStore.logout()}>
        Выйти
      </button>
    </div>
  )
})
