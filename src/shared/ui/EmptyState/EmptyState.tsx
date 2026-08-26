import styles from './EmptyState.module.css'

interface EmptyStateProps {
  message?: string
}

// Состояние "нет данных" (ТЗ §5: empty — «Нет данных за период»).
export function EmptyState({ message = 'Нет данных за период' }: EmptyStateProps) {
  return <div className={styles.wrapper}>{message}</div>
}
