import { useCallback, useState } from 'react'
import { registerByPhone, confirmCode as confirmCodeApi, changePassword as changePasswordApi } from '@/entities/user/api/authApi'
import { authStore } from '@/entities/user/model/authStore'
import { getErrorMessage } from '@/shared/api/errorMessage'
import { getDbGuidFromUrl } from '@/shared/config/dbGuid'

// Требования к паролю — под реальные ограничения бэкенда (см. authApi.js,
// changePassword: сервер отклоняет статусом 6 пароли короче 8 символов или
// без заглавной/строчной буквы и цифры). Изначально заказчик просил не
// требовать сложность («контроль не менее 3-5 символов, сложность не
// обязательна»), но раз сервер её всё равно требует — проверяем то же самое
// на фронте, чтобы не гонять пользователя туда-обратно за ошибкой сервера.
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 50
export const PASSWORD_HINT = 'Минимум 8 символов: заглавная и строчная латинские буквы, цифра'

// Возвращает текст ошибки или null, если пароль подходит под требования
// сервера. Экспортируется отдельно, чтобы страница могла проверить пароль
// ДО отправки запроса (не дожидаясь ответа сервера).
export function validatePassword(password) {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Пароль должен быть от ${PASSWORD_MIN_LENGTH} до ${PASSWORD_MAX_LENGTH} символов`
  }
  if (!/[a-z]/.test(password)) return 'В пароле должна быть строчная латинская буква'
  if (!/[A-Z]/.test(password)) return 'В пароле должна быть заглавная латинская буква'
  if (!/\d/.test(password)) return 'В пароле должна быть цифра'
  return null
}

// Флоу регистрации по телефону (см. API-v2 formatted.md, разделы
// «Регистрация...», «Подтверждение регистрации...», «Изменение пароля»):
// 1) запросить код по телефону (registerByPhone), 2) ввести присланный код
// (confirmCode) — сервер при успехе возвращает СВОЙ сгенерированный пароль,
// 3) этим временным паролем тихо логинимся (нужна сессия для следующего
// шага, сам пароль пользователю не показываем — заказчик явно попросил
// вместо этого дать задать пароль самому), 4) пользователь придумывает
// пароль (форма + подтверждение), 5) меняем пароль на пользовательский
// через changePassword — с этого момента именно он рабочий для входа.
//
// Отдельный хук (не часть authStore) по аналогии с useDrillThrough — это
// разовый локальный флоу экрана регистрации.
export function useRegister() {
  const [step, setStep] = useState('phone') // 'phone' | 'code' | 'password' | 'done'
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(null)

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
        const systemPassword = data?.Password

        if (!systemPassword) {
          setError('Сервер не вернул пароль — обратитесь к администратору')
          return false
        }

        // Тихий вход системным паролем — он нужен только чтобы получить
        // SESSIONID для changePassword на следующем шаге, пользователю
        // никогда не показывается и не запоминается им.
        const didLogin = await authStore.login(phone, systemPassword)

        if (!didLogin) {
          setError(authStore.error || 'Код подтверждён, но не удалось завершить регистрацию. Попробуйте ещё раз.')
          return false
        }

        setStep('password')
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

  const setNewPassword = useCallback(async (newPassword) => {
    setIsLoading(true)
    setError(null)

    try {
      await changePasswordApi(newPassword)
      setStep('done')
      return true
    } catch (err) {
      setError(
        getErrorMessage(err, {
          fallback: 'Не удалось сохранить пароль. Попробуйте ещё раз.',
          statusMessages: {
            2: 'Смена пароля недоступна для этого аккаунта — обратитесь к администратору',
            6: 'Пароль не подходит по требованиям сервера — попробуйте длиннее или добавьте буквы и цифру',
          },
        })
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setStep('phone')
    setPhone('')
    setError(null)
    setTimeLeft(null)
    setAttemptsLeft(null)
  }, [])

  return {
    step,
    phone,
    isLoading,
    error,
    timeLeft,
    attemptsLeft,
    requestCode,
    confirmCode,
    setNewPassword,
    reset,
  }
}
