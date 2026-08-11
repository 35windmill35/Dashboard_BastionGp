import { makeAutoObservable, observable, runInAction } from 'mobx'
import { loginAppUser } from '../api/authApi'
import { getSessionId, setSession, clearSession } from '@/shared/api/session'
import { getDbGuidFromUrl } from '@/shared/config/dbGuid'
import { getErrorMessage } from '@/shared/api/errorMessage'

const FIRMS_STORAGE_KEY = 'growing_points_firms'

class AuthStore {
  firms = []
  dbIndex = 0
  isLoading = false
  error = null

  constructor() {
    // firms — observable.ref, см. объяснение в dashboardStore.js (та же
    // причина: элементы должны оставаться обычными JS-объектами).
    makeAutoObservable(this, { firms: observable.ref })
    this.restoreFirms()
  }

  get isAuthenticated() {
    return Boolean(getSessionId()) && this.firms.length > 0
  }

  // Текущая выбранная база (для шапки — FIRM_SHORT_NAME, и для запросов —
  // сам dbIndex).
  get currentFirm() {
    return this.firms[this.dbIndex] || null
  }

  normalizePhone(rawPhone) {
    // На сервер уходят только цифры (см. ТЗ, п.2.1), маска — только в UI.
    return rawPhone.replace(/\D/g, '')
  }

  async login(rawPhone, password) {
    // Защита от повторного запуска, пока предыдущий логин ещё не завершился
    // (двойной клик/Enter несколько раз подряд, пока идёт медленный запрос к
    // API, — на тестовом стенде loginAppUser может занимать 3-4 секунды).
    // Кнопка на LoginPage и так дизейблится через authStore.isLoading, но
    // это подстраховка на уровне стора, не зависящая от того, успел ли React
    // перерисовать кнопку до следующего клика/Enter.
    if (this.isLoading) return false

    this.isLoading = true
    this.error = null

    try {
      const dbGuid = getDbGuidFromUrl()
      const phone = this.normalizePhone(rawPhone)

      const { firms, sessionId, remaining } = await loginAppUser({ phone, password, dbGuid })

      if (!firms || firms.length === 0) {
        runInAction(() => {
          this.error = 'Для этого аккаунта не найдено ни одной доступной базы. Проверьте ссылку доступа'
          this.isLoading = false
        })

        return false
      }

      setSession({ sessionId, remaining })

      runInAction(() => {
        this.firms = firms
        this.dbIndex = 0
        this.isLoading = false
      })

      this.persistFirms()

      return true
    } catch (err) {
      runInAction(() => {
        this.error = getErrorMessage(err, {
          fallback: 'Не удалось войти. Проверьте телефон и пароль.',
          // 401 на логине — это неверный телефон/пароль (или битая ссылка с
          // DB_GUID), а не «сессия истекла», как для остальных запросов.
          statusMessages: { 401: 'Неверный телефон, пароль или ссылка доступа' },
        })
        this.isLoading = false
      })

      return false
    }
  }

  setDbIndex(index) {
    this.dbIndex = index
  }

  logout() {
    this.firms = []
    this.dbIndex = 0
    this.error = null
    clearSession()
    localStorage.removeItem(FIRMS_STORAGE_KEY)
  }

  persistFirms() {
    localStorage.setItem(FIRMS_STORAGE_KEY, JSON.stringify(this.firms))
  }

  restoreFirms() {
    const raw = localStorage.getItem(FIRMS_STORAGE_KEY)
    if (!raw) return

    try {
      this.firms = JSON.parse(raw)
    } catch {
      this.firms = []
    }
  }
}

export const authStore = new AuthStore()
