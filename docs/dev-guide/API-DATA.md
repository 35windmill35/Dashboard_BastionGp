# Данные и API — что уже готово и как этим пользоваться

Все запросы к API уже реализованы централизованно. **Разработчикам
экранов не нужно писать fetch/HTTP-запросы самим** — только читать
готовые MobX-сторы и вызывать их методы.

## 1. Глобальные фильтры (период, автоцентр) уже подключены

- `authStore.currentFirm` — текущий автоцентр (`{ FIRM_SHORT_NAME, ... }`).
- `periodsStore.periodOptions` — список периодов для выпадающего списка:
  `[{ value: 202606, label: 'Июнь 2026' }, ...]`.
- `periodsStore.selectedPeriodYm` — текущий выбранный период (число,
  например `202606`).
- `periodsStore.setSelectedPeriod(periodYm)` — сменить период.

**Важно:** `dashboardStore` сам автоматически перезагружает данные при
смене `periodsStore.selectedPeriodYm` или `authStore.dbIndex` — экранам
не нужно вручную дёргать загрузку, только читать `dashboardStore.*`.

## 2. Данные дашборда — `dashboardStore`

Импорт:
```js
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'
```

Доступные геттеры (все реактивные, компонент должен быть обёрнут в
`observer`):

| Геттер | Что возвращает |
|---|---|
| `dashboardStore.isLoading` | идёт загрузка данных за период |
| `dashboardStore.error` | текст ошибки или `null` |
| `dashboardStore.kpi` | KPI текущего периода (объект) |
| `dashboardStore.kpiPrev` | KPI предыдущего периода (для расчёта Δ) |
| `dashboardStore.monthly` | массив 12 месяцев, **уже развёрнут** от старого к новому (для графиков слева направо) |
| `dashboardStore.mastersFiltered` | мастера, **уже отфильтрованы** `MASTER_ID <> -1` |
| `dashboardStore.mastersPrev` | мастера за предыдущий период (для Δ Т-фактора, джойнить по `MASTER_ID`) |
| `dashboardStore.mechanicsFiltered` | механики, **уже отфильтрованы** `MECHANIC_ID <> -1` |
| `dashboardStore.marks` | марки авто |
| `dashboardStore.models` | модели авто |
| `dashboardStore.yearsFiltered` | года выпуска, **уже отфильтрованы** `MANUFACTURE_YEAR > 0` |

Пример использования на странице:
```jsx
import { observer } from 'mobx-react-lite'
import { dashboardStore } from '@/entities/dashboard/model/dashboardStore'

export const MastersPage = observer(function MastersPage() {
  if (dashboardStore.isLoading) return <p>Загрузка…</p>
  if (dashboardStore.error) return <p>{dashboardStore.error}</p>

  return (
    <div>
      {dashboardStore.mastersFiltered.map((m) => (
        <div key={m.MASTER_ID}>{m.MASTER_NAME}: {m.TURNOVER} ₽</div>
      ))}
    </div>
  )
})
```

## 3. Поля данных (по разделам ответа)

**`kpi` / `kpiPrev`:**
`PERIOD_YM, TURNOVER, ACCOUNT_COUNT, AVG_CASH, T_FACTOR, ACCURACY,
LABOR_TIME, AVG_SERVICE_TIME, WASTED_TIME_MIN, ARTICLE_WORK_RATIO,
SUMMA_WORK, SUMMA_ARTICLE, RECOMMENDED_SUMM, MECHANIC_COUNT`

**`monthly[]`:**
`PERIOD_YM, MONTH_LABEL, TURNOVER, ACCOUNT_COUNT, AVG_CASH,
ARTICLE_WORK_RATIO` — `MONTH_LABEL` уже отформатирован сервером, но **на
английском** (`"Jun.26"`), не на русском. Если нужна русская подпись —
использовать `PERIOD_YM` и утилиту `formatPeriodLabel` из
`@/shared/lib/periodFormat`.

**`mastersFiltered[]` / `mastersPrev[]`:**
`PERIOD_YM, MASTER_ID, MASTER_NAME, ACCOUNT_COUNT, TURNOVER,
TURNOVER_SHARE, AVG_CASH, ARTICLE_WORK_RATIO, LABOR_TIME, T_FACTOR,
WASTED_TIME_MIN, ACCURACY, SUMMA_WORK, SUMMA_ARTICLE, RECOMMENDED_SUMM`

**`mechanicsFiltered[]`:**
`PERIOD_YM, MECHANIC_ID, MECHANIC_NAME, ACCOUNT_COUNT, TURNOVER,
AVG_CASH, ARTICLE_WORK_RATIO, AVG_SERVICE_TIME, LABOR_TIME, T_FACTOR,
WASTED_TIME_MIN, ACCURACY, SUMMA_WORK, SUMMA_ARTICLE, RECOMMENDED_SUMM`

✅ **В ответе НЕТ `mechanicsPrev`** (в отличие от `mastersPrev`) — но это
больше не проблема: `dashboardStore` сам отдельным запросом подгружает
данные за предыдущий период (тем же `getDashboardData`, см.
`loadPrevPeriod()`) и берёт из него `mechanics` для расчёта Δ. Готовый
результат — в геттере `dashboardStore.mechanicsPrev`, используется в
`MechanicsPage.jsx` точно так же, как `mastersPrev` в `MastersPage.jsx`.
Если предыдущего периода нет (самый первый месяц с данными) — Δ просто не
показывается, это нормально.

**`marks[]`:**
`PERIOD_YM, MARK_ID, MARK_NAME, ACCOUNT_COUNT, TURNOVER, TURNOVER_SHARE,
AVG_CASH, ARTICLE_WORK_RATIO, RECOMMENDED_SUMM, AVG_SERVICE_TIME,
LABOR_TIME, T_FACTOR, WASTED_TIME_MIN, ACCURACY, SUMMA_WORK, SUMMA_ARTICLE`

**`models[]`** (уже, чем marks — без T_FACTOR/ACCURACY/WASTED_TIME_MIN):
`PERIOD_YM, MODEL_ID, MODEL_NAME, MARK_ID, MARK_NAME, ACCOUNT_COUNT,
TURNOVER, AVG_CASH, ARTICLE_WORK_RATIO, RECOMMENDED_SUMM, SUMMA_WORK,
SUMMA_ARTICLE`

**`yearsFiltered[]`** (тоже без T_FACTOR/ACCURACY/WASTED_TIME_MIN):
`PERIOD_YM, MANUFACTURE_YEAR, ACCOUNT_COUNT, TURNOVER, AVG_CASH,
ARTICLE_WORK_RATIO, SUMMA_WORK, SUMMA_ARTICLE`

## 4. Подводные камни при выводе данных

1. **ID-заглушки** — `-1` уже отфильтрован в `mastersFiltered` /
   `mechanicsFiltered` / `yearsFiltered`. Если понадобятся
   нефильтрованные данные (общие агрегаты) — берите `dashboardStore.data.masters`
   напрямую, но тогда сами решайте, показывать ли служебные строки.
2. **`null` в числовых полях** — не приводить к `0`, показывать «—».
   Особенно часто `null` встречается в `LABOR_TIME`, `T_FACTOR`,
   `AVG_SERVICE_TIME`, `RECOMMENDED_SUMM` у записей с маленьким
   `ACCOUNT_COUNT`.
3. **Лишние пробелы в именах** (например
   `"Смурыгин  Евгений Михайлович "`) — делайте `.trim()` и схлопывайте
   двойные пробелы перед выводом. Общая утилита для этого будет добавлена
   в `shared/lib` — если её ещё нет, напишите временную
   (`name.trim().replace(/\s+/g, ' ')`) и сообщите лиду, чтобы не
   расходились реализации.
4. **Форматирование чисел** — ru-RU, пробел как разделитель тысяч, ₽ без
   копеек в KPI. Утилита форматирования — в `shared/lib` (см. `START.md`).

## 5. Drill-through (список ЗН по клику)

Метод уже есть в `entities/dashboard/api/dashboardApi.js`:

```js
import { getAccountList } from '@/entities/dashboard/api/dashboardApi'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'

const accounts = await getAccountList(
  periodsStore.selectedPeriodYm,
  authStore.dbIndex,
  { filterString: 'MASTER_ID=?', filterParam: [masterId] }
)
```

✅ **Структура ответа проверена на реальном стенде** (26.07.2026):
`result.Response.DashboardGrowingPointAccounts.{data, totalRecords}`. Поля
строки: `ACCOUNT_ID, ACCOUNT_CODE, OWNER_NAME, MARK_ID/MARK_NAME,
MODEL_ID/MODEL_NAME, MANUFACTURE_YEAR, MASTER_ID/MASTER_NAME,
MAIN_MECHANIC_ID/MAIN_MECHANIC_NAME, SCHEDULED_TIME, LABOR_TIME,
WASTED_TIME_MIN, T_FACTOR, SUMMA_WORK, SUMMA_ARTICLE, SUMMA,
ARTICLE_WORK_RATIO, DATE_END` и др.

⚠ **Важно:** для заказ-нарядов поле механика называется
`MAIN_MECHANIC_ID`, а не `MECHANIC_ID` (как в агрегате `mechanics` на
экране «Механики») — разные имена в разных методах API. Именно это
изначально вызывало ошибку «поле не принимается» при фильтрации ЗН по
механику.

Модалка для отображения списка (общий компонент) — см. `shared/ui` в
`START.md`.

## 6. Открытые вопросы (пока без ответа)

- Права доступа (`SpecialRequests/UserRight`) — опционально по ТЗ, не
  реализовано, делаем только если останется время.

Если ваш экран упирается в один из этих пунктов — не блокируйтесь,
сделайте вёрстку и логику на моках/заглушках, пометьте `TODO` в коде и
сообщите лиду.
