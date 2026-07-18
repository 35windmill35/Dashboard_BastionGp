import { makeAutoObservable, observable, runInAction, reaction } from 'mobx'
import { getDashboardData } from '../api/dashboardApi'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from './periodsStore'

class DashboardStore {
  data = null
  isLoading = false
  error = null

  constructor() {
    // `data` — observable.ref (не глубокий observable): реактивность нужна
    // только на замену всего объекта при смене периода, а вложенные
    // массивы/объекты (monthly, masters и т.д.) должны оставаться обычными
    // JS-объектами. Иначе Recharts/React пытаются сделать Object.freeze
    // над MobX-прокси и падают с ошибкой "Dynamic observable objects
    // cannot be frozen".
    makeAutoObservable(this, { data: observable.ref })

    // Автоматическая перезагрузка данных при смене периода или автоцентра
    // (глобальные фильтры из шапки, см. ТЗ §3). Страницам/виджетам не нужно
    // самим дёргать load() — только читать this.data.
    reaction(
      () => [periodsStore.selectedPeriodYm, authStore.dbIndex],
      ([periodYm]) => {
        if (periodYm) this.load(periodYm)
      }
    )
  }

  // monthly в ответе идёт от нового периода к старому — для графика
  // "слева направо по времени" разворачиваем.
  get monthly() {
    return this.data?.monthly ? [...this.data.monthly].reverse() : []
  }

  get kpi() {
    return this.data?.kpi || null
  }

  get kpiPrev() {
    return this.data?.kpiPrev || null
  }

  // Экран «Мастера»: фильтр MASTER_ID <> -1 (см. ТЗ §4.3)
  get mastersFiltered() {
    return (this.data?.masters || []).filter((m) => m.MASTER_ID !== -1)
  }

  get mastersPrev() {
    return this.data?.mastersPrev || []
  }

  // Экран «Механики»: фильтр MECHANIC_ID <> -1 (см. ТЗ §4.4)
  get mechanicsFiltered() {
    return (this.data?.mechanics || []).filter((m) => m.MECHANIC_ID !== -1)
  }

  get marks() {
    return this.data?.marks || []
  }

  get models() {
    return this.data?.models || []
  }

  // Вкладка «По году выпуска»: фильтр MANUFACTURE_YEAR > 0 (см. ТЗ §4.5)
  get yearsFiltered() {
    return (this.data?.years || []).filter((y) => y.MANUFACTURE_YEAR > 0)
  }

  async load(periodYm) {
    this.isLoading = true
    this.error = null

    try {
      const data = await getDashboardData(periodYm, authStore.dbIndex)

      runInAction(() => {
        this.data = data
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err.message || 'Не удалось загрузить данные дашборда'
        this.isLoading = false
      })
    }
  }
}

export const dashboardStore = new DashboardStore()
