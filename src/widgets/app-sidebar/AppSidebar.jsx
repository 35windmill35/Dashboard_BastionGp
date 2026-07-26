import { observer } from 'mobx-react-lite'
import { NavLink } from 'react-router-dom'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { formatPeriodLabel } from '@/shared/lib/periodFormat'
import { IconGrid, IconTrendUp, IconUsers, IconWrench, IconCar } from './icons'
import styles from './AppSidebar.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Обзор', end: true, Icon: IconGrid },
  { to: '/efficiency', label: 'Эффективность', Icon: IconTrendUp },
  { to: '/masters', label: 'Мастера', Icon: IconUsers },
  { to: '/mechanics', label: 'Механики', Icon: IconWrench },
  { to: '/brands', label: 'Марки/Модели/Годы', Icon: IconCar },
]

// Левая боковая навигация (ТЗ §3, вид под референс из ТЗ —
// https://tochki-rosta.pplx.app). Сама навигация между экранами — здесь;
// фильтр по автоцентру/периоду и кнопка выхода вынесены в соседний
// AppTopBar (см. этот же файл), т.к. в референсе это два разных визуальных
// блока (сайдбар — только меню, фильтры — узкая полоса над контентом).
export const AppSidebar = observer(function AppSidebar() {
  const periodLabel = periodsStore.selectedPeriodYm ? formatPeriodLabel(periodsStore.selectedPeriodYm) : ''

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>Т</span>
        <div>
          <div className={styles.brandName}>Точки роста</div>
          {periodLabel && <div className={styles.brandPeriod}>{periodLabel}</div>}
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
})
