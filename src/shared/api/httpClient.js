import { BASE_URL } from '@/shared/config/api'
import { getSessionId } from '@/shared/api/session'

// Кастомная ошибка API — хранит код Status (см. таблицу кодов в заметках по
// API) и сообщение от сервера, чтобы UI мог показать осмысленный текст.
// data — сам объект Response, даже когда Status != 0 (некоторые методы
// кладут туда полезные детали ошибки даже при неуспехе — например,
// confirmCode при неверном коде (Status 27) возвращает Response.AttemptsLeft
// с оставшимся числом попыток).
export class ApiError extends Error {
  constructor(status, message, data) {
    super(message || `API error, status=${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Собирает URL с query-параметрами. Поддерживает вложенные объекты вида
// Params: { DB_GUID: '...' } -> Params[DB_GUID]=...
function buildUrl(path, params = {}) {
  const url = new URL(path, BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null) {
          url.searchParams.set(`${key}[${nestedKey}]`, nestedValue)
        }
      })
      return
    }

    url.searchParams.set(key, value)
  })

  return url.toString()
}

// Единая точка разбора ответа сервера. Реальная форма ответа (проверено на
// стенде, отличается от примера в ТЗ):
// { result: { Status, Message, Response }, SESSIONID, remaining, api_version }
async function parseResponse(response) {
  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}`)
  }

  const body = await response.json()
  const { Status, Message, Response: data } = body.result || {}

  if (Status !== 0) {
    throw new ApiError(Status, Message, data)
  }

  return {
    data,
    sessionId: body.SESSIONID,
    remaining: body.remaining,
  }
}

// GET с Basic Auth — нужен только для auth-методов (loginAppUser,
// registerByPhone, confirmCode), пока ещё нет SESSIONID.
//
// headers — доп. HTTP-заголовки. Для registerByPhone/confirmCode DB_GUID
// передаётся именно так — заголовком "Params" со значением в виде JSON-
// строки (например '{"DB_GUID":"..."}'), а НЕ query-параметром
// Params[DB_GUID]=..., как для loginAppUser (см. authApi.js — там два разных
// метода передачи Params, оба подтверждены на реальных запросах 30.07.2026).
export async function getWithBasicAuth(path, { username, password, params, headers } = {}) {
  const response = await fetch(buildUrl(path, params), {
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      ...headers,
    },
  })

  return parseResponse(response)
}

// GET с Bearer SESSIONID — основной способ для всех методов после логина
// (Dashboard/*, SpecialRequests/* и т.д.)
export async function getAuthorized(path, { params } = {}) {
  const sessionId = getSessionId()

  if (!sessionId) {
    throw new ApiError(401, 'Нет активной сессии — требуется повторный вход')
  }

  const response = await fetch(buildUrl(path, params), {
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  })

  return parseResponse(response)
}
