import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Navigate } from 'react-router-dom'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { AppHeader } from '@/widgets/app-header/AppHeader'
import styles from './ProtectedLayout.module.css'

// Оборачивает защищённые страницы: нет сессии — редирект на /login, иначе
// рендерит глобальную шапку (фильтры + навигация, см. ТЗ §3) и контент.
export const ProtectedLayout = observer(function ProtectedLayout({ children }) {
  // Подстраховка: periodsStore обычно подгружает периоды сам через reaction
  // на authStore.isAuthenticated (см. periodsStore.js), но при самой первой
  // инициализации сторов (порядок вычисления модулей при холодном старте)
  // эта реакция иногда успевает сработать раньше, чем сессия/список баз
  // полностью восстановлены — тогда периоды остаются пустыми до перезагрузки
  // страницы. Эта проверка при каждом заходе на защищённый экран страхует
  // от такого случая, не мешая обычной работе (условие сработает только
  // если периоды и правда ещё не загружены).
  useEffect(() => {
    if (authStore.isAuthenticated && periodsStore.periods.length === 0 && !periodsStore.isLoading) {
      periodsStore.load(authStore.dbIndex)
    }
  }, [])

  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className={styles.wrapper}>
      <AppHeader />
      <main className={styles.main}>{children}</main>
    </div>
  )
})
