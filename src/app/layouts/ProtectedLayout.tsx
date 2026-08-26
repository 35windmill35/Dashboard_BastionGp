import { useEffect, type ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { Navigate, useLocation } from 'react-router-dom'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'
import { AppSidebar } from '@/widgets/app-sidebar/AppSidebar'
import { AppTopBar } from '@/widgets/app-sidebar/AppTopBar'
import styles from './ProtectedLayout.module.css'

interface ProtectedLayoutProps {
  children?: ReactNode
}

// Оборачивает защищённые страницы: нет сессии — редирект на /login, иначе
// рендерит глобальную шапку (фильтры + навигация, см. ТЗ §3) и контент.
export const ProtectedLayout = observer(function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const location = useLocation()
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
    // Сохраняем query-строку (DB_GUID приходит именно так, см.
    // shared/config/dbGuid.js) при редиректе на /login — раньше редирект
    // делался на голый "/login" без параметров, и если пользователь открывал
    // ссылку вида "#/?DB_GUID=..." ещё не залогиненным, DB_GUID терялся
    // ещё до того, как форма логина успевала его прочитать.
    return <Navigate to={`/login${location.search}`} replace />
  }

  return (
    <div className={styles.wrapper}>
      <AppSidebar />
      <div className={styles.contentColumn}>
        <div className={styles.contentInner}>
          <AppTopBar />
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </div>
  )
})
