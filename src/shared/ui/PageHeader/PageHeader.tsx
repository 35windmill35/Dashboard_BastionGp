import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

// Заголовок экрана + подпись под ним (вид — под референс из ТЗ,
// https://tochki-rosta.pplx.app: везде под крупным заголовком есть мелкая
// серая строка с периодом/контекстом). Используется на всех 5 экранах
// вместо разрозненных <h1 className={styles.title}>.
//
// Пример:
// <PageHeader title="Механики" subtitle={`Статистика по исполнителям — ${periodLabel}`} />
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  )
}
