import { Modal } from '@/shared/ui/Modal/Modal'
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary/AsyncBoundary'
import { DataTable } from '@/shared/ui/DataTable/DataTable'
import { formatCurrency, formatPercent, cleanName, formatShortName } from '@/shared/lib/formatters'

// Модалка со списком ЗН (drill-through). Использовать вместе с
// useDrillThrough — см. пример в этом хуке.
//
// Структура ответа AccountListDashboardGrowingPoints подтверждена на
// реальном стенде 26.07.2026 (см. dashboardApi.js) — колонки заданы вручную
// с человекочитаемыми заголовками и форматированием через formatters.js.
const COLUMNS = [
  { key: 'ACCOUNT_CODE', header: '№ ЗН' },
  { key: 'DATE_END', header: 'Дата выдачи' },
  { key: 'OWNER_NAME', header: 'Клиент', render: (r) => cleanName(r.OWNER_NAME) || '—' },
  {
    key: 'MARK_NAME',
    header: 'Марка / модель',
    render: (r) => [cleanName(r.MARK_NAME), cleanName(r.MODEL_NAME)].filter(Boolean).join(' / ') || '—',
  },
  { key: 'MASTER_NAME', header: 'Мастер', render: (r) => formatShortName(r.MASTER_NAME) || '—' },
  { key: 'MAIN_MECHANIC_NAME', header: 'Механик', render: (r) => formatShortName(r.MAIN_MECHANIC_NAME) || '—' },
  { key: 'SUMMA', header: 'Сумма', render: (r) => formatCurrency(r.SUMMA) },
  { key: 'ARTICLE_WORK_RATIO', header: 'Доля товаров', render: (r) => formatPercent(r.ARTICLE_WORK_RATIO) },
  { key: 'T_FACTOR', header: 'Т-фактор', render: (r) => formatPercent(r.T_FACTOR) },
]

export function DrillThroughModal({ isOpen, title, accounts, isLoading, error, close }) {
  return (
    <Modal isOpen={isOpen} onClose={close} title={title}>
      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && !error && accounts.length === 0}
        emptyMessage="Нет заказ-нарядов, формирующих эту метрику"
      >
        <DataTable columns={COLUMNS} data={accounts} getRowKey={(row, i) => row.ACCOUNT_ID ?? i} />
      </AsyncBoundary>
    </Modal>
  )
}
