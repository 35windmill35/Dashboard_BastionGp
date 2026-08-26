import { getWithBasicAuth, getAuthorized } from '@/shared/api/httpClient'
import { APP_CODE } from '@/shared/config/api'

// GET /api-v2/auth/loginAppUser?AppCode=...&Params[DB_GUID]=...
// Authorization: Basic <телефон_без_плюса>:<пароль>
// Заголовок Params: '{"DB_GUID":"..."}' — см. ⚠ ниже.
//
// Ответ (result.Response) — массив баз, доступных пользователю
// (мультибазность). DBIndex, который потом принимают методы Dashboard/*, —
// это порядковый индекс элемента в этом массиве, а не PFIRM_ID.
//
// ⚠ ТЗ показывает DB_GUID как query-параметр (Params[DB_GUID]=...), но по
// факту (см. registerByPhone/confirmCode ниже — та же проблема, подтверждена
// реальным запросом от другого приложения 30.07.2026) бэкенд читает Params
// из HTTP-заголовка, а не из query-строки. Пользователи жаловались, что
// DB_GUID «не доходит» именно на этом методе — отправляем DB_GUID ОБОИМИ
// способами одновременно (заголовок + query), чтобы не зависеть от того,
// какой из двух документирован верно.
export async function loginAppUser({ phone, password, dbGuid }) {
  const { data, sessionId, remaining } = await getWithBasicAuth('/api-v2/auth/loginAppUser', {
    username: phone,
    password,
    params: {
      AppCode: APP_CODE,
      Params: { DB_GUID: dbGuid },
    },
    headers: dbGuid ? { Params: JSON.stringify({ DB_GUID: dbGuid }) } : undefined,
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

// GET /api-v2/auth/changePassword/<base64(новый пароль)>
// Authorization: Bearer <SESSIONID>
//
// ⚠ Общая документация API-v2 описывает этот метод с ?API_KEY=<...> — это
// более старая "веб" схема авторизации. Наш мобильный флоу
// (loginAppUser/SESSIONID) такого API_KEY не использует нигде в проекте,
// поэтому здесь взято по аналогии со всеми остальными запросами после
// логина — Bearer SESSIONID (см. getAuthorized в httpClient.js). Это
// предположение НЕ проверено на реальном стенде (в отличие от DB_GUID через
// заголовок Params, который проверен скриншотом) — если сервер ждёt другую
// авторизацию, тут будет 401/403, и это надо будет уточнить отдельно через
// Postman.
//
// base64Password кодируется через encodeURIComponent — символы "+/=" из
// обычного base64 иначе ломают путь URL (например, "/" воспринялся бы как
// разделитель сегментов пути).
//
// Требования сервера к паролю (см. документацию): не менее 8 и не более 50
// символов, минимум 1 строчная и 1 заглавная латинские буквы и 1 цифра.
// Наша форма (см. RegisterPage.jsx) по требованию заказчика проверяет на
// фронте только длину, без сложности — но сервер может всё равно отклонить
// слишком простой пароль статусом 6.
//
// Ответ — только статус: 0 (успех), 2 (нельзя сменить пароль — пользователь
// аутентифицирован не по паре логин/пароль), 6 (пароль не прошёл проверку
// сложности).
export async function changePassword(newPassword) {
  const base64Password = btoa(unescape(encodeURIComponent(newPassword)))
  await getAuthorized(`/api-v2/auth/changePassword/${encodeURIComponent(base64Password)}`)
}
