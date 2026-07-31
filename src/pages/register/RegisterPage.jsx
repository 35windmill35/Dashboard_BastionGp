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
  const [copied, setCopied] = useState(false)

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(register.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Буфер обмена недоступен (нет разрешения/старый браузер) — пароль
      // всё равно выделяем текстом (user-select: all в CSS), можно скопировать
      // вручную.
    }
  }

  const handlePhoneChange = (e) => setPhoneInput(formatPhoneInput(e.target.value))

  const handleRequestCode = async (e) => {
    e.preventDefault()
    await register.requestCode(phoneInput)
  }

  const handleConfirmCode = async (e) => {
    e.preventDefault()
    // Дальше — шаг 'done': пароль показывается ВСЕГДА (см. useRegister.js),
    // переход в дашборд — по явному клику, а не автоматически, чтобы
    // пользователь точно успел увидеть и сохранить пароль.
    await register.confirmCode(codeInput)
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

        {register.step === 'done' && register.password && (
          <div className={styles.stepForm}>
            <p className={styles.hint}>
              Регистрация завершена. Ваш пароль (сохраните его — он больше нигде не показывается и пригодится для
              входа с другого устройства):
            </p>
            <div className={styles.passwordRow}>
              <span className={styles.passwordReveal}>{register.password}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyPassword}
                title="Скопировать пароль"
                aria-label="Скопировать пароль"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            {copied && <p className={styles.copiedHint}>Скопировано</p>}

            {register.loggedIn ? (
              <button type="button" className={styles.submit} onClick={() => navigate('/')}>
                Сохранил(а) пароль — продолжить в дашборд
              </button>
            ) : (
              <>
                <p className={styles.hint}>Автоматический вход не удался — войдите этим паролем обычной формой.</p>
                <Link className={styles.submit} to={`/login${location.search}`}>
                  Перейти к форме входа
                </Link>
              </>
            )}
          </div>
        )}

        <Link className={styles.registerLink} to={`/login${location.search}`}>
          Уже есть пароль? Войти
        </Link>
      </div>
    </div>
  )
})
