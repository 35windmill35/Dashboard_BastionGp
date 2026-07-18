import { observer } from 'mobx-react-lite'
import { Navigate } from 'react-router-dom'
import { authStore } from '@/entities/user/model/authStore'

// Оборачивает защищённые страницы: нет сессии/баз — редирект на /login.
export const RequireAuth = observer(function RequireAuth({ children }) {
  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
})
