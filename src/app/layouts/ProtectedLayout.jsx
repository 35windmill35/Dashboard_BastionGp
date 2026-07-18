import { observer } from 'mobx-react-lite'
import { Navigate } from 'react-router-dom'
import { authStore } from '@/entities/user/model/authStore'
import { AppHeader } from '@/widgets/app-header/AppHeader'
import styles from './ProtectedLayout.module.css'

// Оборачивает защищённые страницы: нет сессии — редирект на /login, иначе
// рендерит глобальную шапку (фильтры + навигация, см. ТЗ §3) и контент.
export const ProtectedLayout = observer(function ProtectedLayout({ children }) {
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
