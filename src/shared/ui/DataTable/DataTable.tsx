import { useMemo, useState, type ReactNode } from 'react'
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip'
import styles from './DataTable.module.css'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  tooltip?: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  wrap?: boolean
  maxWidth?: number
}

interface SortState {
  key: string | null
  direction: 1 | -1
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey?: (row: T, i: number) => string | number
  onRowClick?: (row: T) => void
}

// Универсальная таблица с сортировкой по клику на заголовок и
// drill-through по клику на строку (см. ТЗ: сводные таблицы на всех
// экранах устроены одинаково — колонки с тултипами, клик по строке).
//
// columns: [{ key, header, tooltip?, render?(row), sortable? = true, align?, wrap? }]
// wrap: true — не nowrap, ячейка переносится по словам (для длинных ФИО)
// data: массив объектов
// getRowKey: (row) => string|number — по умолчанию берёт row.id либо индекс
// onRowClick: (row) => void — если передан, строка кликабельна (курсор + hover)
//
// Пример:
// <DataTable
//   columns={[
//     { key: 'MASTER_NAME', header: 'Мастер' },
//     { key: 'TURNOVER', header: 'Оборот', tooltip: 'Оборот мастера', render: (r) => formatCurrency(r.TURNOVER) },
//   ]}
//   data={dashboardStore.mastersFiltered}
//   getRowKey={(r) => r.MASTER_ID}
//   onRowClick={(r) => openDrillThrough({ filterString: 'MASTER_ID=?', filterParam: [r.MASTER_ID] })}
// />
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: 1 })

  const sortedData = useMemo(() => {
    if (!sort.key) return data

    const sortKey = sort.key

    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]

      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1

      return av > bv ? sort.direction : -sort.direction
    })
  }, [data, sort])

  const handleHeaderClick = (col: DataTableColumn<T>) => {
    if (col.sortable === false) return

    setSort((prev) =>
      prev.key === col.key
        ? { key: col.key, direction: -prev.direction as 1 | -1 }
        : { key: col.key, direction: 1 }
    )
  }

  return (
    <div className={styles.outer}>
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => {
                // Тултип оборачивает только содержимое заголовка, а не сам
                // <th> — <span> не может быть прямым потомком <tr>, только
                // <td>/<th>, иначе браузер ломает вёрстку таблицы.
                const label = (
                  <>
                    {col.header}
                    {sort.key === col.key && (sort.direction === 1 ? ' ▲' : ' ▼')}
                  </>
                )

                return (
                  <th
                    key={col.key}
                    className={`${styles.th} ${col.sortable === false ? '' : styles.sortable}`}
                    onClick={() => handleHeaderClick(col)}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.tooltip ? (
                      <Tooltip text={col.tooltip} placement="bottom">
                        {label}
                      </Tooltip>
                    ) : (
                      label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={getRowKey ? getRowKey(row, i) : i}
                className={onRowClick ? styles.clickableRow : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={styles.td}
                    style={{
                      textAlign: col.align || 'left',
                      // wrap: true — длинный текст (напр. ФИО клиента) переносится
                      // по словам, а не растягивает всю строку в одну линию
                      whiteSpace: col.wrap ? 'normal' : 'nowrap',
                      ...(col.wrap
                        ? { maxWidth: col.maxWidth || 220, wordBreak: 'break-word' as const }
                        : {}),
                    }}
                  >
                    {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Подсказка «можно скроллить вправо» — на мобильных таблица шире
          экрана и уходит в горизонтальный скролл (см. .wrapper), но без
          подсказки не все догадаются свайпнуть. */}
      <div className={styles.scrollHint} aria-hidden="true" />
    </div>
  )
}
