import { makeAutoObservable, observable, runInAction, reaction } from 'mobx'
import { getPeriods } from '../api/dashboardApi'
import {
  formatPeriodLabel,
  formatQuarterLabel,
  formatYearLabel,
  periodYmToYear,
  periodYmToYq,
} from '@/shared/lib/periodFormat'
import { authStore } from '@/entities/user/model/authStore'
import { getErrorMessage } from '@/shared/api/errorMessage'

class PeriodsStore {
  periods = []
  selectedPeriodYm = null

  // Комбобокс периода: режим (Месяц/Квартал/Год) + своё выбранное значение
  // на каждый режим — так при переключении туда-обратно не теряется, что
  // было выбрано (см. ТЗ "Общее": два комбобокса, второй зависит от первого).
  periodMode = 'month' // 'month' | 'quarter' | 'year'
  selectedYear = null
  selectedYq = null

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
          this.periodMode = 'month'
          this.selectedYear = null
          this.selectedYq = null
          this.error = null
        }
      },
      { fireImmediately: true }
    )
  }

  // С 18.08.2026 бэкенд отдаёт единый список, где строки трёх разных типов
  // (PERIOD_TYPE: 'M'/'Q'/'Y') просто свалены в одном массиве и НЕ идут по
  // порядку дат сквозь весь массив — сначала все Q, потом все Y, потом все
  // M (проверено реальным ответом). Поэтому периоды нужного типа всегда
  // сначала фильтруем, а не берём this.periods напрямую.
  get monthPeriods() {
    return this.periods.filter((p) => p.PERIOD_TYPE === 'M')
  }

  // Список для выпадающего списка: [{ value: 202606, label: 'Июнь 2026' }, ...]
  get periodOptions() {
    return this.monthPeriods.map((p) => ({
      value: p.PERIOD_YM,
      label: formatPeriodLabel(p.PERIOD_YM),
    }))
  }

  // Года и кварталы теперь приходят от бэкенда отдельными строками
  // (PERIOD_TYPE 'Y'/'Q', значения — PERIOD_YEAR/PERIOD_YQ), а не считаются
  // на клиенте из PERIOD_YM месяцев, как было раньше.
  get yearOptions() {
    return this.periods
      .filter((p) => p.PERIOD_TYPE === 'Y')
      .map((p) => ({ value: p.PERIOD_YEAR, label: formatYearLabel(p.PERIOD_YEAR) }))
      .sort((a, b) => b.value - a.value)
  }

  get quarterOptions() {
    return this.periods
      .filter((p) => p.PERIOD_TYPE === 'Q')
      .map((p) => ({ value: p.PERIOD_YQ, label: formatQuarterLabel(p.PERIOD_YQ) }))
      .sort((a, b) => b.value - a.value)
  }

  // Единая точка, откуда dashboardStore/useDrillThrough берут, что грузить —
  // { type: 'month'|'quarter'|'year', value } или null, пока периоды не
  // подгрузились. См. dashboardApi.periodParams.
  get selectedPeriod() {
    if (this.periodMode === 'year') return this.selectedYear ? { type: 'year', value: this.selectedYear } : null
    if (this.periodMode === 'quarter') return this.selectedYq ? { type: 'quarter', value: this.selectedYq } : null
    return this.selectedPeriodYm ? { type: 'month', value: this.selectedPeriodYm } : null
  }

  get selectedPeriodLabel() {
    const period = this.selectedPeriod
    if (!period) return ''
    if (period.type === 'year') return formatYearLabel(period.value)
    if (period.type === 'quarter') return formatQuarterLabel(period.value)
    return formatPeriodLabel(period.value)
  }

  async load(dbIndex) {
    this.isLoading = true
    this.error = null

    try {
      const periods = await getPeriods(dbIndex)

      runInAction(() => {
        this.periods = periods
        this.selectedPeriodYm = this.pickDefaultPeriod(periods)
        // Года/кварталы пересчитываем на каждую загрузку — у другого
        // автоцентра может не быть того года/квартала, что был выбран раньше.
        this.selectedYear = periods.length ? periodYmToYear(this.selectedPeriodYm) : null
        this.selectedYq = periods.length ? periodYmToYq(this.selectedPeriodYm) : null
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
  // элемент (последний полностью закрытый период), если он есть. Внутри
  // одного PERIOD_TYPE строки идут от нового к старому.
  pickDefaultPeriod(periods) {
    const months = periods.filter((p) => p.PERIOD_TYPE === 'M')
    if (!months.length) return null
    return months[1]?.PERIOD_YM ?? months[0].PERIOD_YM
  }

  setSelectedPeriod(periodYm) {
    // Клик по точке/бару на графике (тренд по месяцам) всегда должен
    // приводить к помесячному виду, даже если до этого был выбран год/квартал.
    this.periodMode = 'month'
    this.selectedPeriodYm = periodYm
  }

  setPeriodMode(mode) {
    this.periodMode = mode
  }

  setSelectedYear(year) {
    this.selectedYear = year
  }

  setSelectedQuarter(yq) {
    this.selectedYq = yq
  }

  // Ближайший предыдущий доступный период (для клиентского расчёта Δ там,
  // где бэкенд не отдаёт свой *Prev — см. dashboardStore.mechanicsPrev).
  // Массив идёт от нового периода к старому, поэтому "предыдущий" — это
  // следующий элемент после текущего. Через индекс в списке периодов, а не
  // через "PERIOD_YM - 1", чтобы корректно перескакивать через месяцы без
  // данных.
  get previousPeriodYm() {
    if (!this.selectedPeriodYm) return null
    const months = this.monthPeriods
    const index = months.findIndex((p) => p.PERIOD_YM === this.selectedPeriodYm)
    if (index === -1) return null
    return months[index + 1]?.PERIOD_YM ?? null
  }
}

export const periodsStore = new PeriodsStore()
