import { useState, type InputHTMLAttributes } from 'react'
import { EyeIcon, EyeOffIcon } from './icons'
import styles from './PasswordInput.module.css'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'style'> {
  className?: string
}

// Поле пароля с кнопкой "показать/скрыть" — используется на логине и в
// форме задания/смены пароля (регистрация по телефону). className — стили
// самого инпута приходят снаружи (каждая форма подключает свой .input из
// собственного CSS-модуля), тут только обёртка + кнопка-глаз поверх.
// paddingRight инлайном, чтобы текст не заезжал под кнопку независимо от
// того, в каком порядке подключились CSS-модули страницы и этого компонента.
export function PasswordInput({ className, ...inputProps }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.wrapper}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ paddingRight: 40, width: '100%' }}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
