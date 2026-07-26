import { makeAutoObservable, observable, runInAction } from 'mobx'
import { loginAppUser } from '../api/authApi'
import { getSessionId, setSession, clearSession } from '@/shared/api/session'
import { getDbGuidFromUrl } from '@/shared/config/dbGuid'

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

  // Есть SESSIONID в хранилище и хотя бы одна база — считаем пользователя
  // залогиненным. Полноценной проверки истечения remaining на фронте не
  // делаем: если SESSIONID протухнет, следующий запрос к API вернёт
  // ошибку 401, и это будет обработано на уровне запроса (см. Этап далее).
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
    this.isLoading = true
    this.error = null

    try {
      const dbGuid = getDbGuidFromUrl()
      const phone = this.normalizePhone(rawPhone)

      const { firms, sessionId, remaining } = await loginAppUser({ phone, password, dbGuid })

      // Сессию сохраняем ДО обновления firms: isAuthenticated зависит от
      // обоих (getSessionId() && firms.length), а MobX пересчитывает
      // реакции сразу в момент присвоения observable-поля firms. Если
      // сессия ещё не сохранена в этот момент, periodsStore/dashboardStore
      // увидят "не залогинен" и не подгрузят данные до следующего
      // обновления страницы — обычный порядок операций отсюда важен.
      setSession({ sessionId, remaining })

      runInAction(() => {
        this.firms = firms || []
        this.dbIndex = 0
        this.isLoading = false
      })

      this.persistFirms()

      return true
    } catch (err) {
      runInAction(() => {
        this.error = err.message || 'Не удалось войти. Проверьте телефон и пароль.'
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
