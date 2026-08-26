import { WarningIcon, CheckIcon } from './icons'
import styles from './InsightBanner.module.css'

// Карточка-сводка (см. референс из ТЗ, низ экрана «Эффективность»):
// короткий вывод-подсказка + пояснение цифрами. variant="warning" —
// красная, что-то требует внимания; variant="success" — зелёная, хороший
// показатель. Сама логика "что считать хорошим/плохим показателем" — на
// стороне страницы (см. EfficiencyPage.jsx), компонент только отображает.
//
// Пример:
// <InsightBanner
//   variant="warning"
//   title="Высокие потери у Волощенко"
//   description="137 мин потерь на ЗН — существенно выше среднего (69 мин). Требует разбора."
// />
export function InsightBanner({ variant = 'warning', title, description }) {
  const Icon = variant === 'success' ? CheckIcon : WarningIcon

  return (
    <div className={`${styles.banner} ${variant === 'success' ? styles.success : styles.warning}`}>
      <Icon />
      <div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </div>
  )
}
