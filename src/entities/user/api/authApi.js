import { getWithBasicAuth } from '@/shared/api/httpClient'
import { APP_CODE } from '@/shared/config/api'

// GET /api-v2/auth/loginAppUser?AppCode=...&Params[DB_GUID]=...
// Authorization: Basic <телефон_без_плюса>:<пароль>
//
// Ответ (result.Response) — массив баз, доступных пользователю
// (мультибазность). DBIndex, который потом принимают методы Dashboard/*, —
// это порядковый индекс элемента в этом массиве, а не PFIRM_ID.
export async function loginAppUser({ phone, password, dbGuid }) {
  const { data, sessionId, remaining } = await getWithBasicAuth('/api-v2/auth/loginAppUser', {
    username: phone,
    password,
    params: {
      AppCode: APP_CODE,
      Params: { DB_GUID: dbGuid },
    },
  })

  return { firms: data, sessionId, remaining }
}

// GET /api-v2/auth/registerByPhone?AppCode=...
// Authorization: Basic <телефон_без_плюса>:Register!
//
// Регистрация пользователя мобильного приложения по телефону (см. общую
// документацию API-v2, раздел «Регистрация пользователя мобильного
// приложения по телефону»). Пароль в Basic Auth — не пароль пользователя, а
// служебное слово "Register!" (именно с большой буквы и восклицательным
// знаком, так в документации). DB_GUID здесь НЕ передаётся — по документации
// поиск идёт сразу по всем базам, привязанным к AppCode; DB_GUID нужен
// только для финального loginAppUser (выбор конкретной базы).
//
// Статусы ответа: 0 (успех, на телефон выслан код, Response содержит
// TimeLeft/AttemptsLeft), 17/20/22/23/24/30 — коды ошибок (обрабатываются
// как ApiError через httpClient, см. shared/api/errorMessage.js).
export async function registerByPhone({ phone }) {
  const { data } = await getWithBasicAuth('/api-v2/auth/registerByPhone', {
    username: phone,
    password: 'Register!',
    params: { AppCode: APP_CODE },
  })

  return data
}

// GET /api-v2/auth/confirmCode?AppCode=...
// Authorization: Basic <тот же телефон>:<код из SMS>
//
// Подтверждение кода из SMS. При статусе 0 Response содержит поле Password —
// сгенерированный сервером пароль, который дальше используется как обычный
// пароль в loginAppUser (см. authStore.completeRegistration).
export async function confirmCode({ phone, code }) {
  const { data } = await getWithBasicAuth('/api-v2/auth/confirmCode', {
    username: phone,
    password: code,
    params: { AppCode: APP_CODE },
  })

  return data
}
