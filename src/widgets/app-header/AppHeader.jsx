import { observer } from 'mobx-react-lite'
import { NavLink } from 'react-router-dom'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import styles from './AppHeader.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Обзор', end: true },
  { to: '/efficiency', label: 'Эффективность' },
  { to: '/masters', label: 'Мастера' },
  { to: '/mechanics', label: 'Механики' },
  { to: '/brands', label: 'Марки/Модели/Годы' },
]

// Глобальная шапка (ТЗ §3): фильтр по автоцентру (скрыт, если база одна),
// фильтр по периоду, навигация между экранами. Доступна на всех защищённых
// страницах — подключена в app/layouts/ProtectedLayout.
export const AppHeader = observer(function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <span className={styles.logo}>Точки роста</span>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.filters}>
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
      </div>
    </header>
  )
})
