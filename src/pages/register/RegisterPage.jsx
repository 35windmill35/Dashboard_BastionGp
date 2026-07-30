import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { formatPhoneInput } from '@/shared/lib/phoneMask'
import { useRegister } from '@/features/register/model/useRegister'
import styles from './RegisterPage.module.css'

// Регистрация по телефону (см. API-v2 formatted.md — методов нет в самом
// ТЗ ID-5817, ТЗ описывает только вход уже зарегистрированного пользователя,
// но по факту у части пользователей ещё нет пароля вовсе). Флоу:
// 1) телефон → запрос кода (registerByPhone), 2) код из SMS → confirmCode,
// сервер возвращает пароль, 3) логинимся этим паролем как обычно.
export const RegisterPage = observer(function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const register = useRegister()

  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [revealedPassword, setRevealedPassword] = useState(null)

  const handlePhoneChange = (e) => setPhoneInput(formatPhoneInput(e.target.value))

  const handleRequestCode = async (e) => {
    e.preventDefault()
    await register.requestCode(phoneInput)
  }

  const handleConfirmCode = async (e) => {
    e.preventDefault()
    const result = await register.confirmCode(codeInput)

    if (result === true) {
      navigate('/')
    } else if (typeof result === 'string') {
      // login после регистрации не удался — пароль всё равно получен,
      // показываем его, чтобы пользователь мог войти вручную.
      setRevealedPassword(result)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <h1 className={styles.title}>Регистрация по телефону</h1>

        {register.step === 'phone' && (
          <form className={styles.stepForm} onSubmit={handleRequestCode}>
            <label className={styles.field}>
              <span className={styles.label}>Телефон</span>
              <input
                className={styles.input}
                type="tel"
                inputMode="numeric"
                placeholder="+7 (___) ___-__-__"
                value={phoneInput}
                onChange={handlePhoneChange}
                autoComplete="tel"
                required
              />
            </label>

            {register.error && <p className={styles.error}>{register.error}</p>}

            <button className={styles.submit} type="submit" disabled={register.isLoading}>
              {register.isLoading ? 'Отправляем код…' : 'Получить код по SMS'}
            </button>
          </form>
        )}

        {register.step === 'code' && (
          <form className={styles.stepForm} onSubmit={handleConfirmCode}>
            <p className={styles.hint}>
              Код отправлен на {phoneInput || register.phone}
              {register.timeLeft ? ` — действителен ${register.timeLeft} сек.` : ''}
            </p>

            <label className={styles.field}>
              <span className={styles.label}>Код из SMS</span>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                autoFocus
                required
              />
            </label>

            {register.error && <p className={styles.error}>{register.error}</p>}

            <button className={styles.submit} type="submit" disabled={register.isLoading}>
              {register.isLoading ? 'Проверяем…' : 'Подтвердить и войти'}
            </button>

            <button type="button" className={styles.linkButton} onClick={register.reset}>
              Ввести другой телефон
            </button>
          </form>
        )}

        {register.step === 'done' && revealedPassword && (
          <div className={styles.stepForm}>
            <p className={styles.hint}>
              Регистрация прошла успешно, но автоматический вход не удался. Ваш пароль:
            </p>
            <p className={styles.passwordReveal}>{revealedPassword}</p>
            <p className={styles.hint}>Сохраните его — он понадобится для входа. Дальше войдите обычной формой.</p>
            <Link className={styles.submit} to={`/login${location.search}`}>
              Перейти к форме входа
            </Link>
          </div>
        )}

        <Link className={styles.registerLink} to={`/login${location.search}`}>
          Уже есть пароль? Войти
        </Link>
      </div>
    </div>
  )
})
