import { useMemo, useState } from 'react'
import { Tooltip } from '@/shared/ui/Tooltip/Tooltip'
import styles from './DataTable.module.css'

// Универсальная таблица с сортировкой по клику на заголовок и
// drill-through по клику на строку (см. ТЗ: сводные таблицы на всех
// экранах устроены одинаково — колонки с тултипами, клик по строке).
//
// columns: [{ key, header, tooltip?, render?(row), sortable? = true, align? }]
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
export function DataTable({ columns, data, getRowKey, onRowClick }) {
  const [sort, setSort] = useState({ key: null, direction: 1 })

  const sortedData = useMemo(() => {
    if (!sort.key) return data

    return [...data].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]

      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1

      return av > bv ? sort.direction : -sort.direction
    })
  }, [data, sort])

  const handleHeaderClick = (col) => {
    if (col.sortable === false) return

    setSort((prev) =>
      prev.key === col.key ? { key: col.key, direction: -prev.direction } : { key: col.key, direction: 1 }
    )
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const header = (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.sortable === false ? '' : styles.sortable}`}
                  onClick={() => handleHeaderClick(col)}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.header}
                  {sort.key === col.key && (sort.direction === 1 ? ' ▲' : ' ▼')}
                </th>
              )

              return col.tooltip ? (
                <Tooltip key={col.key} text={col.tooltip}>
                  {header}
                </Tooltip>
              ) : (
                header
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
                <td key={col.key} className={styles.td} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
