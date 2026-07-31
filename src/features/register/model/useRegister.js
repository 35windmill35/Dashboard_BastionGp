import { useCallback, useState } from 'react'
import { registerByPhone, confirmCode as confirmCodeApi } from '@/entities/user/api/authApi'
import { authStore } from '@/entities/user/model/authStore'
import { getErrorMessage } from '@/shared/api/errorMessage'
import { getDbGuidFromUrl } from '@/shared/config/dbGuid'

// Флоу регистрации по телефону (см. API-v2 formatted.md, разделы
// «Регистрация пользователя мобильного приложения по телефону» и
// «Подтверждение регистрации...»): 1) запросить код по телефону, 2) ввести
// присланный код, 3) сервер возвращает пароль — логинимся им как обычно
// через authStore.login (тот же loginAppUser, что и при обычном входе).
//
// Отдельный хук (не часть authStore) по аналогии с useDrillThrough — это
// разовый локальный флоу экрана регистрации, а не часть глобального
// состояния авторизации, пока не получен реальный пароль и не выполнен login.
export function useRegister() {
  const [step, setStep] = useState('phone') // 'phone' | 'code' | 'done'
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(null)
  // Пароль, сгенерированный сервером в ответ на confirmCode. Приходит ТОЛЬКО
  // в этом ответе — нигде больше не хранится и повторно не присылается
  // (не по SMS, не по почте). Поэтому показываем его пользователю ВСЕГДА на
  // шаге 'done', независимо от того, удался ли автовход — иначе он будет
  // безвозвратно потерян и пользователь не сможет войти с другого браузера
  // или устройства.
  const [password, setPassword] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)

  const requestCode = useCallback(async (rawPhone) => {
    setIsLoading(true)
    setError(null)

    try {
      const normalized = authStore.normalizePhone(rawPhone)
      const data = await registerByPhone({ phone: normalized, dbGuid: getDbGuidFromUrl() })

      setPhone(normalized)
      setTimeLeft(data?.TimeLeft ?? null)
      setAttemptsLeft(data?.AttemptsLeft ?? null)
      setStep('code')

      return true
    } catch (err) {
      setError(
        getErrorMessage(err, {
          fallback: 'Не удалось отправить код. Попробуйте ещё раз.',
          statusMessages: {
            20: 'Этот телефон уже зарегистрирован и заблокирован администратором',
            23: 'Телефон не найден ни в одной базе — обратитесь к администратору',
            30: 'Сейчас нет возможности отправить код. Попробуйте позже',
          },
        })
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const confirmCode = useCallback(
    async (code) => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await confirmCodeApi({ phone, code, dbGuid: getDbGuidFromUrl() })
        const generatedPassword = data?.Password

        if (!generatedPassword) {
          setError('Сервер не вернул пароль — обратитесь к администратору')
          return false
        }

        // Логинимся сразу сгенерированным паролем — обычный authStore.login
        // (тот же loginAppUser, с DB_GUID из адресной строки и т.п.). Пароль
        // запоминаем и показываем на шаге 'done' в любом случае (см.
        // комментарий у объявления password выше) — вне зависимости от
        // успеха автовхода.
        const didLogin = await authStore.login(phone, generatedPassword)

        setPassword(generatedPassword)
        setLoggedIn(didLogin)
        setStep('done')

        return true
      } catch (err) {
        // На статусе 27 (неверный код) сервер присылает свежий остаток
        // попыток в Response.AttemptsLeft — берём его из err.data, а не из
        // локального state (тот хранит значение из предыдущего запроса).
        const freshAttemptsLeft = err?.data?.AttemptsLeft
        if (freshAttemptsLeft != null) setAttemptsLeft(freshAttemptsLeft)

        setError(
          getErrorMessage(err, {
            fallback: 'Не удалось подтвердить код. Попробуйте ещё раз.',
            statusMessages: {
              26: 'Кончились попытки ввода кода — начните регистрацию заново',
              27: 'Неверный код' + (freshAttemptsLeft != null ? `, осталось попыток: ${freshAttemptsLeft}` : ''),
            },
          })
        )
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [phone]
  )

  const reset = useCallback(() => {
    setStep('phone')
    setPhone('')
    setError(null)
    setTimeLeft(null)
    setAttemptsLeft(null)
    setPassword(null)
    setLoggedIn(false)
  }, [])

  return {
    step,
    phone,
    isLoading,
    error,
    timeLeft,
    attemptsLeft,
    password,
    loggedIn,
    requestCode,
    confirmCode,
    reset,
  }
}
