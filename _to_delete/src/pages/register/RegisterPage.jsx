import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { formatPhoneInput } from '@/shared/lib/phoneMask'
import { useRegister, validatePassword, PASSWORD_MIN_LENGTH, PASSWORD_HINT } from '@/features/register/model/useRegister'
import { PasswordInput } from '@/shared/ui/PasswordInput/PasswordInput'
import styles from './RegisterPage.module.css'

// Регистрация по телефону (см. API-v2 formatted.md — методов нет в самом
// ТЗ ID-5817, ТЗ описывает только вход уже зарегистрированного пользователя,
// но по факту у части пользователей ещё нет пароля вовсе). Флоу (по правкам
// заказчика от 31.07.2026 — пароль придумывает сам пользователь, а не
// сервер):
// 1) телефон → запрос кода (registerByPhone)
// 2) код из SMS → confirmCode (внутри — тихий вход временным системным
//    паролем, он нигде не показывается)
// 3) пользователь придумывает пароль (форма + подтверждение) → changePassword
export const RegisterPage = observer(function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const register = useRegister()

  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordConfirmInput, setPasswordConfirmInput] = useState('')
  const [passwordFormError, setPasswordFormError] = useState(null)

  const handlePhoneChange = (e) => setPhoneInput(formatPhoneInput(e.target.value))

  const handleRequestCode = async (e) => {
    e.preventDefault()
    await register.requestCode(phoneInput)
  }

  const handleConfirmCode = async (e) => {
    e.preventDefault()
    // Дальше — шаг 'password': confirmCode внутри уже тихо залогинил
    // временным системным паролем, теперь просим пользователя придумать
    // свой (см. useRegister.js).
    await register.confirmCode(codeInput)
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setPasswordFormError(null)

    const validationError = validatePassword(passwordInput)
    if (validationError) {
      setPasswordFormError(validationError)
      return
    }

    if (passwordInput !== passwordConfirmInput) {
      setPasswordFormError('Пароли не совпадают')
      return
    }

    await register.setNewPassword(passwordInput)
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
              {register.isLoading ? 'Проверяем…' : 'Подтвердить'}
            </button>

            <button type="button" className={styles.linkButton} onClick={register.reset}>
              Ввести другой телефон
            </button>
          </form>
        )}

        {register.step === 'password' && (
          <form className={styles.stepForm} onSubmit={handleSetPassword}>
            <p className={styles.hint}>Телефон подтверждён. Придумайте пароль для входа.</p>
            <p className={styles.hint}>{PASSWORD_HINT}</p>

            <label className={styles.field}>
              <span className={styles.label}>Пароль</span>
              <PasswordInput
                className={styles.input}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete="new-password"
                autoFocus
                required
                minLength={PASSWORD_MIN_LENGTH}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Повторите пароль</span>
              <PasswordInput
                className={styles.input}
                value={passwordConfirmInput}
                onChange={(e) => setPasswordConfirmInput(e.target.value)}
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN_LENGTH}
              />
            </label>

            {(passwordFormError || register.error) && (
              <p className={styles.error}>{passwordFormError || register.error}</p>
            )}

            <button className={styles.submit} type="submit" disabled={register.isLoading}>
              {register.isLoading ? 'Сохраняем…' : 'Сохранить пароль и войти'}
            </button>
          </form>
        )}

        {register.step === 'done' && (
          <div className={styles.stepForm}>
            <p className={styles.hint}>Готово! Пароль сохранён, вы вошли в дашборд.</p>
            <button type="button" className={styles.submit} onClick={() => navigate('/')}>
              Перейти в дашборд
            </button>
          </div>
        )}

        {register.step !== 'password' && register.step !== 'done' && (
          <Link className={styles.registerLink} to={`/login${location.search}`}>
            Уже есть пароль? Войти
          </Link>
        )}
      </div>
    </div>
  )
})
