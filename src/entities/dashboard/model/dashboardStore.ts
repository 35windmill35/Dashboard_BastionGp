import { makeAutoObservable, observable, runInAction, reaction } from 'mobx'
import { getDashboardData } from '../api/dashboardApi'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from './periodsStore'
import { getErrorMessage } from '@/shared/api/errorMessage'
import { formatTrendLabel } from '@/shared/lib/periodFormat'
import type { DashboardData, MetricRow, TrendRow, Period } from './types'

class DashboardStore {
  data: DashboardData | null = null
  isLoading = false
  error: string | null = null

  // Данные за предыдущий период — только для расчёта Δ Т-фактора механиков
  // на фронте (см. mechanicsPrev ниже). В отличие от data, это "тихая"
  // подгрузка: свой независимый isLoading не нужен, отсутствие/ошибка не
  // должны блокировать основной экран — Δ просто не покажется.
  prevPeriodData: DashboardData | null = null

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
      () => [periodsStore.selectedPeriod, authStore.dbIndex] as const,
      ([period]) => {
        if (period) this.load(period)
      }
    )

    // Логаут — сбрасываем данные и ошибку прошлой сессии, чтобы после
    // повторного login() экран не показал на миг старые цифры/ошибку от
    // предыдущего пользователя, пока не придёт ответ нового запроса.
    reaction(
      () => authStore.isAuthenticated,
      (isAuthenticated) => {
        if (!isAuthenticated) {
          this.data = null
          this.prevPeriodData = null
          this.error = null
          this.isLoading = false
        }
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
  get isLoadingAny(): boolean {
    return periodsStore.isLoading || this.isLoading
  }

  get errorAny(): string | null {
    return periodsStore.error || this.error
  }

  // monthly в ответе идёт от нового периода к старому — для графика
  // "слева направо по времени" разворачиваем. Несмотря на название, теперь
  // тут могут быть и кварталы/года (смотря какой periodMode выбран) — см.
  // formatTrendLabel.
  get monthly(): TrendRow[] {
    if (!this.data?.monthly) return []
    // MONTH_LABEL от сервера приходит по-английски (Jun.25) — переписываем
    // на русский, см. правки заказчика.
    return [...this.data.monthly].reverse().map((m) => ({ ...m, MONTH_LABEL: formatTrendLabel(m) }))
  }

  get kpi(): MetricRow | null {
    return this.data?.kpi || null
  }

  get kpiPrev(): MetricRow | null {
    return this.data?.kpiPrev || null
  }

  // Экран «Мастера»: фильтр MASTER_ID <> -1 (см. ТЗ §4.3)
  get mastersFiltered(): MetricRow[] {
    return (this.data?.masters || []).filter((m) => m.MASTER_ID !== -1)
  }

  get mastersPrev(): MetricRow[] {
    return this.data?.mastersPrev || []
  }

  // Экран «Механики»: фильтр MECHANIC_ID <> -1 (см. ТЗ §4.4)
  get mechanicsFiltered(): MetricRow[] {
    return (this.data?.mechanics || []).filter((m) => m.MECHANIC_ID !== -1)
  }

  // В API нет своего mechanicsPrev (в отличие от mastersPrev) — данные за
  // предыдущий период запрашиваются отдельно (см. load()) тем же методом
  // getDashboardData, из него берём mechanics для расчёта Δ Т-фактора на
  // экране «Механики». Если предыдущего периода нет (например, самый
  // первый месяц) — просто пустой массив, Δ у всех строк будет пустой.
  get mechanicsPrev(): MetricRow[] {
    return this.prevPeriodData?.mechanics || []
  }

  get marks(): MetricRow[] {
    return this.data?.marks || []
  }

  get models(): MetricRow[] {
    return this.data?.models || []
  }

  // Вкладка «По году выпуска»: фильтр MANUFACTURE_YEAR > 0 (см. ТЗ §4.5)
  get yearsFiltered(): MetricRow[] {
    return (this.data?.years || []).filter((y) => (y.MANUFACTURE_YEAR ?? 0) > 0)
  }

  // period — { type: 'month'|'quarter'|'year', value }, см. periodsStore.selectedPeriod
  async load(period: Period): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      const data = await getDashboardData(period, authStore.dbIndex)

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
    this.loadPrevPeriod(period)
  }

  async loadPrevPeriod(period: Period): Promise<void> {
    // "Предыдущий период" через periodsStore.previousPeriodYm посчитан
    // только для помесячного режима — для года/квартала своего понятия
    // "предыдущий" в списке периодов нет, Δ там просто не показываем.
    if (period.type !== 'month') {
      runInAction(() => {
        this.prevPeriodData = null
      })
      return
    }

    const prevPeriodYm = periodsStore.previousPeriodYm

    if (!prevPeriodYm) {
      runInAction(() => {
        this.prevPeriodData = null
      })
      return
    }

    try {
      const data = await getDashboardData({ type: 'month', value: prevPeriodYm }, authStore.dbIndex)

      runInAction(() => {
        // Проверка на гонку: пока грузился предыдущий период, пользователь
        // мог уже переключить период ещё раз — тогда этот ответ устарел.
        const current = periodsStore.selectedPeriod
        if (current?.type === 'month' && current.value === period.value) {
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
