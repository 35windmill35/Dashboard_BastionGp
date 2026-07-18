import { Skeleton } from '@/shared/ui/Skeleton/Skeleton'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState/ErrorState'

// Склеивает три обязательных состояния из ТЗ §5 (loading/empty/error) в
// одном месте, чтобы не дублировать if/if/if на каждом экране.
//
// Пример:
// <AsyncBoundary
//   isLoading={dashboardStore.isLoading}
//   error={dashboardStore.error}
//   isEmpty={dashboardStore.mastersFiltered.length === 0}
//   onRetry={() => periodsStore.load(authStore.dbIndex)}
// >
//   <MastersTable data={dashboardStore.mastersFiltered} />
// </AsyncBoundary>
export function AsyncBoundary({
  isLoading,
  error,
  isEmpty,
  onRetry,
  skeleton,
  emptyMessage,
  children,
}) {
  if (isLoading) return skeleton ?? <Skeleton height={120} count={2} />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (isEmpty) return <EmptyState message={emptyMessage} />

  return children
}
