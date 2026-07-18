import styles from './EmptyState.module.css'

// Состояние "нет данных" (ТЗ §5: empty — «Нет данных за период»).
export function EmptyState({ message = 'Нет данных за период' }) {
  return <div className={styles.wrapper}>{message}</div>
}
