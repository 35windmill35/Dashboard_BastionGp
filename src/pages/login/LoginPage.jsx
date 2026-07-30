import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authStore } from '@/entities/user/model/authStore'
import { formatPhoneInput } from '@/shared/lib/phoneMask'
import styles from './LoginPage.module.css'

export const LoginPage = observer(function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneInput(e.target.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const success = await authStore.login(phone, password)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Дашборд «Точки роста»</h1>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            inputMode="numeric"
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пароль</span>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {authStore.error && <p className={styles.error}>{authStore.error}</p>}

        <button className={styles.submit} type="submit" disabled={authStore.isLoading}>
          {authStore.isLoading ? 'Входим…' : 'Войти'}
        </button>

        {/* Сохраняем query-строку (DB_GUID может быть встроен в хэш — см.
            shared/config/dbGuid.js), чтобы регистрация тоже могла его
            использовать при финальном логине. */}
        <Link className={styles.registerLink} to={`/register${location.search}`}>
          Нет пароля? Зарегистрироваться по телефону
        </Link>
      </form>
    </div>
  )
})
