import { Modal } from '@/shared/ui/Modal/Modal'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { DataTable } from '@/shared/ui/DataTable/DataTable'

// Модалка со списком ЗН (drill-through). Использовать вместе с
// useDrillThrough — см. пример в этом хуке.
//
// ⚠ Колонки строятся автоматически из ключей первого элемента ответа,
// т.к. точная структура ответа getAccountList ещё не подтверждена
// практикой (см. API-DATA.md, п.4.5/4.6). Как только реальная структура
// будет известна — эту модалку стоит доработать: задать человекочитаемые
// заголовки колонок и форматирование сумм/дат через @/shared/lib/formatters
// вместо сырых значений.
export function DrillThroughModal({ isOpen, title, accounts, isLoading, error, close }) {
  const columns =
    accounts.length > 0
      ? Object.keys(accounts[0]).map((key) => ({ key, header: key, sortable: true }))
      : []

  return (
    <Modal isOpen={isOpen} onClose={close} title={title}>
      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && !error && accounts.length === 0}
        emptyMessage="Нет заказ-нарядов, формирующих эту метрику"
      >
        <DataTable columns={columns} data={accounts} getRowKey={(row, i) => row.ACCOUNT_ID ?? i} />
      </AsyncBoundary>
    </Modal>
  )
}
