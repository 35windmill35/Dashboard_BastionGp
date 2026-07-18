import { makeAutoObservable, runInAction, reaction } from 'mobx'
import { getPeriods } from '../api/dashboardApi'
import { formatPeriodLabel } from '@/shared/lib/periodFormat'
import { authStore } from '@/entities/user/model/authStore'

class PeriodsStore {
  periods = []
  selectedPeriodYm = null
  isLoading = false
  error = null

  constructor() {
    makeAutoObservable(this)

    // Как только пользователь залогинен (и при смене автоцентра) —
    // подтягиваем список доступных периодов заново.
    reaction(
      () => [authStore.isAuthenticated, authStore.dbIndex],
      ([isAuthenticated, dbIndex]) => {
        if (isAuthenticated) this.load(dbIndex)
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
        this.error = err.message || 'Не удалось загрузить список периодов'
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
}

export const periodsStore = new PeriodsStore()
