import { makeAutoObservable, observable, runInAction, reaction } from 'mobx'
import { getDashboardData } from '../api/dashboardApi'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from './periodsStore'
import { getErrorMessage } from '@/shared/api/errorMessage'

class DashboardStore {
  data = null
  isLoading = false
  error = null

  // Данные за предыдущий период — только для расчёта Δ Т-фактора механиков
  // на фронте (см. mechanicsPrev ниже). В отличие от data, это "тихая"
  // подгрузка: свой независимый isLoading не нужен, отсутствие/ошибка не
  // должны блокировать основной экран — Δ просто не покажется.
  prevPeriodData = null

  constructor() {
    // `data` — observable.ref (не глубокий observable): реактивность нужна
    // только на замену всего объекта при смене периода, а вложенные
    // массивы/объекты (monthly, masters и т.д.) должны оставаться обычными
    // JS-объектами. Иначе Recharts/React пытаются сделать Object.freeze
    // над MobX-прокси и падают с ошибкой "Dynamic observable objects
    // cannot be frozen".
    makeAutoObservable(this, { data: observable.ref, prevPeriodData: observable.ref })

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

  // Загрузка/ошибка "в широком смысле" — учитывает и загрузку самого
  // списка периодов. Без этого между входом на экран и моментом, когда
  // periodsStore успевает подгрузить периоды (и только после этого
  // запускается загрузка данных дашборда), isLoading здесь ещё false, а
  // kpi уже null — экран на секунду показывает "Нет данных" вместо
  // "Загрузка". Использовать isLoadingAny/errorAny в AsyncBoundary вместо
  // isLoading/error там, где на странице нужен корректный лоадер с самого
  // первого захода (см. страницы Обзор/Эффективность/Механики/Мастера/Марки).
  get isLoadingAny() {
    return periodsStore.isLoading || this.isLoading
  }

  get errorAny() {
    return periodsStore.error || this.error
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

  // В API нет своего mechanicsPrev (в отличие от mastersPrev) — данные за
  // предыдущий период запрашиваются отдельно (см. load()) тем же методом
  // getDashboardData, из него берём mechanics для расчёта Δ Т-фактора на
  // экране «Механики». Если предыдущего периода нет (например, самый
  // первый месяц) — просто пустой массив, Δ у всех строк будет пустой.
  get mechanicsPrev() {
    return this.prevPeriodData?.mechanics || []
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
        this.error = getErrorMessage(err, { fallback: 'Не удалось загрузить данные дашборда' })
        this.isLoading = false
      })
    }

    // Отдельно и не блокируя основной экран — подгружаем предыдущий период
    // только ради mechanics (Δ Т-фактора). Ошибка/отсутствие предыдущего
    // периода намеренно не отражаются в isLoading/error: это необязательное
    // улучшение таблицы, а не критичные для экрана данные.
    this.loadPrevPeriod(periodYm)
  }

  async loadPrevPeriod(periodYm) {
    const prevPeriodYm = periodsStore.previousPeriodYm

    if (!prevPeriodYm) {
      runInAction(() => {
        this.prevPeriodData = null
      })
      return
    }

    try {
      const data = await getDashboardData(prevPeriodYm, authStore.dbIndex)

      runInAction(() => {
        // Проверка на гонку: пока грузился предыдущий период, пользователь
        // мог уже переключить период ещё раз — тогда этот ответ устарел.
        if (periodsStore.selectedPeriodYm === periodYm) {
          this.prevPeriodData = data
        }
      })
    } catch {
      runInAction(() => {
        this.prevPeriodData = null
      })
    }
  }
}

export const dashboardStore = new DashboardStore()
