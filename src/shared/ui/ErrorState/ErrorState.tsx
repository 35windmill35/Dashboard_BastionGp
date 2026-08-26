import styles from './ErrorState.module.css'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

// Состояние ошибки (ТЗ §5: error — сообщение + повтор). onRetry необязателен
// — если не передан, кнопка "Повторить" не показывается.
export function ErrorState({ message = 'Не удалось загрузить данные', onRetry }: ErrorStateProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retry} type="button" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}
