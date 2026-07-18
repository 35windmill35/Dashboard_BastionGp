import styles from './Skeleton.module.css'

// Универсальный скелетон-плейсхолдер на время загрузки (ТЗ §5: состояние
// loading). Передавайте width/height под форму реального контента:
// <Skeleton height={80} /> для карточки KPI, <Skeleton height={280} /> для
// графика и т.д. Для набора одинаковых плейсхолдеров — count.
export function Skeleton({ width = '100%', height = 20, radius, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{
            width,
            height,
            borderRadius: radius ?? 'var(--radius-sm)',
            marginBottom: count > 1 && i < count - 1 ? 8 : 0,
          }}
        />
      ))}
    </>
  )
}
