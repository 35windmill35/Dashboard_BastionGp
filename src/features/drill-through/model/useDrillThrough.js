import { useCallback, useState } from 'react'
import { getAccountList } from '@/entities/dashboard/api/dashboardApi'
import { authStore } from '@/entities/user/model/authStore'
import { periodsStore } from '@/entities/dashboard/model/periodsStore'

// Хук управления drill-through модалкой (список ЗН по клику на
// метрику/строку/точку графика — см. ТЗ, "Drill-through" во всех разделах).
// Один экземпляр на страницу, подключать в компонент вместе с
// <DrillThroughModal {...drillThrough} />.
//
// Пример:
// const drillThrough = useDrillThrough()
// <DataTable onRowClick={(row) => drillThrough.open({
//   title: `ЗН мастера ${row.MASTER_NAME}`,
//   filterString: 'MASTER_ID=?',
//   filterParam: [row.MASTER_ID],
// })} .../>
// <DrillThroughModal {...drillThrough} />
export function useDrillThrough() {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const open = useCallback(async ({ title: modalTitle, filterString, filterParam, sortBy, sortOrder }) => {
    setIsOpen(true)
    setTitle(modalTitle || 'Список заказ-нарядов')
    setIsLoading(true)
    setError(null)

    try {
      const data = await getAccountList(periodsStore.selectedPeriodYm, authStore.dbIndex, {
        filterString,
        filterParam,
        sortBy,
        sortOrder,
      })

      // Структура ответа этого метода не подтверждена практикой (см.
      // API-DATA.md) — подстраховываемся под пару вероятных форм ответа.
      const list = Array.isArray(data) ? data : data?.data || data?.Response || []
      setAccounts(list)
    } catch (err) {
      setError(err.message || 'Не удалось загрузить список заказ-нарядов')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, title, accounts, isLoading, error, open, close }
}
