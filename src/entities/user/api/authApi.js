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
// Заголовок Params: '{"DB_GUID":"..."}' (JSON-строка, НЕ query-параметр!)
//
// Регистрация пользователя мобильного приложения по телефону (см. общую
// документацию API-v2, раздел «Регистрация пользователя мобильного
// приложения по телефону»). Пароль в Basic Auth — не пароль пользователя, а
// служебное слово "Register!" (именно с большой буквы и восклицательным
// знаком, так в документации).
//
// ⚠ DB_GUID передаётся заголовком Params с JSON-строкой в значении — это
// отличается от loginAppUser, где Params уходит query-параметром
// (Params[DB_GUID]=...). Формат подтверждён скриншотом реального рабочего
// запроса от другого приложения на этом же бэкенде (30.07.2026): без этого
// заголовка сервер ищет телефон сразу по всем базам AppCode и не находит
// пользователя, зарегистрированного в конкретной базе по ссылке.
//
// Статусы ответа: 0 (успех, на телефон выслан код, Response содержит
// TimeLeft/AttemptsLeft), 17/20/22/23/24/30 — коды ошибок (обрабатываются
// как ApiError через httpClient, см. shared/api/errorMessage.js).
export async function registerByPhone({ phone, dbGuid }) {
  const { data } = await getWithBasicAuth('/api-v2/auth/registerByPhone', {
    username: phone,
    password: 'Register!',
    params: { AppCode: APP_CODE },
    headers: dbGuid ? { Params: JSON.stringify({ DB_GUID: dbGuid }) } : undefined,
  })

  return data
}

// GET /api-v2/auth/confirmCode?AppCode=...
// Authorization: Basic <тот же телефон>:<код из SMS>
// Заголовок Params: '{"DB_GUID":"..."}' — на всякий случай передаём тем же
// способом, что и в registerByPhone (см. комментарий выше), для консистентности
// в рамках одной попытки регистрации.
//
// Подтверждение кода из SMS. При статусе 0 Response содержит поле Password —
// сгенерированный сервером пароль, который дальше используется как обычный
// пароль в loginAppUser (см. authStore.login).
export async function confirmCode({ phone, code, dbGuid }) {
  const { data } = await getWithBasicAuth('/api-v2/auth/confirmCode', {
    username: phone,
    password: code,
    params: { AppCode: APP_CODE },
    headers: dbGuid ? { Params: JSON.stringify({ DB_GUID: dbGuid }) } : undefined,
  })

  return data
}
