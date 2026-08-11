import { makeAutoObservable, observable, runInAction, reaction } from 'mobx'
import { getPeriods } from '../api/dashboardApi'
import { formatPeriodLabel } from '@/shared/lib/periodFormat'
import { authStore } from '@/entities/user/model/authStore'
import { getErrorMessage } from '@/shared/api/errorMessage'

class PeriodsStore {
  periods = []
  selectedPeriodYm = null
  isLoading = false
  error = null

  constructor() {
    // periods — observable.ref, см. подробное объяснение в dashboardStore.js
    // (нужно, чтобы данные оставались обычными JS-объектами для Recharts/React).
    makeAutoObservable(this, { periods: observable.ref })

    // Как только пользователь залогинен (и при смене автоцентра) —
    // подтягиваем список доступных периодов заново.
    reaction(
      () => [authStore.isAuthenticated, authStore.dbIndex],
      ([isAuthenticated, dbIndex]) => {
        if (isAuthenticated) {
          this.load(dbIndex)
        } else {
          // Логаут — сбрасываем список периодов и старую ошибку. Без этого
          // после logout()/повторного login() на экране могла на миг мелькать
          // "стухшая" ошибка или период из предыдущей сессии, пока не придёт
          // ответ нового запроса.
          this.periods = []
          this.selectedPeriodYm = null
          this.error = null
        }
      },
      { fireImmediately: true }
    )
  }

  // Список для выпадающего списка: [{ value: 202606, label: 'Июнь 2026' }, ...]
  get periodOptions() {
    return this.periods.map((p) => ({
      value: p.PERIOD_YM,
      label: formatPeriodLabel(p.PERIOD_YM),
    }))
  }

  async load(dbIndex) {
    this.isLoading = true
    this.error = null

    try {
      const periods = await getPeriods(dbIndex)

      runInAction(() => {
        this.periods = periods
        this.selectedPeriodYm = this.pickDefaultPeriod(periods)
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = getErrorMessage(err, { fallback: 'Не удалось загрузить список периодов' })
        this.isLoading = false
      })
    }
  }

  // Самый свежий период обычно неполный (текущий месяц ещё не закончился,
  // ACCOUNT_COUNT заметно ниже соседних) — по умолчанию берём второй
  // элемент (последний полностью закрытый период), если он есть.
  // Массив приходит от нового периода к старому.
  pickDefaultPeriod(periods) {
    if (!periods.length) return null
    return periods[1]?.PERIOD_YM ?? periods[0].PERIOD_YM
  }

  setSelectedPeriod(periodYm) {
    this.selectedPeriodYm = periodYm
  }

  // Ближайший предыдущий доступный период (для клиентского расчёта Δ там,
  // где бэкенд не отдаёт свой *Prev — см. dashboardStore.mechanicsPrev).
  // Массив идёт от нового периода к старому, поэтому "предыдущий" — это
  // следующий элемент после текущего. Через индекс в списке периодов, а не
  // через "PERIOD_YM - 1", чтобы корректно перескакивать через месяцы без
  // данных.
  get previousPeriodYm() {
    if (!this.selectedPeriodYm) return null
    const index = this.periods.findIndex((p) => p.PERIOD_YM === this.selectedPeriodYm)
    if (index === -1) return null
    return this.periods[index + 1]?.PERIOD_YM ?? null
  }
}

export const periodsStore = new PeriodsStore()
