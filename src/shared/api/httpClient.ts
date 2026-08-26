import { BASE_URL } from '@/shared/config/api'
import { getSessionId } from '@/shared/api/session'

// Кастомная ошибка API — хранит код Status (см. таблицу кодов в заметках по
// API) и сообщение от сервера, чтобы UI мог показать осмысленный текст.
// data — сам объект Response, даже когда Status != 0 (некоторые методы
// кладут туда полезные детали ошибки даже при неуспехе — например,
// confirmCode при неверном коде (Status 27) возвращает Response.AttemptsLeft
// с оставшимся числом попыток).
export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message?: string, data?: unknown) {
    super(message || `API error, status=${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type QueryParamPrimitive = string | number | boolean

type QueryParamValue =
  QueryParamPrimitive | null | undefined | Record<string, QueryParamPrimitive | null | undefined>

export type QueryParams = Record<string, QueryParamValue>

// Собирает URL с query-параметрами. Поддерживает вложенные объекты вида
// Params: { DB_GUID: '...' } -> Params[DB_GUID]=...
function buildUrl(path: string, params: QueryParams = {}): string {
  const url = new URL(path, BASE_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null) {
          url.searchParams.set(`${key}[${nestedKey}]`, String(nestedValue))
        }
      })
      return
    }

    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

export interface ApiResult<T = unknown> {
  data: T
  sessionId?: string
  remaining?: number
}

// Единая точка разбора ответа сервера. Реальная форма ответа (проверено на
// стенде, отличается от примера в ТЗ):
// { result: { Status, Message, Response }, SESSIONID, remaining, api_version }
async function parseResponse<T = unknown>(response: Response): Promise<ApiResult<T>> {
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

// Дедупликация одинаковых одновременных запросов. На форме логина/
// регистрации на практике по одному сабмиту иногда уходят 2 идентичных
// запроса подряд (наблюдалось даже в чистом инкогнито-окне без расширений,
// после полного рестарта dev-сервера — источник дублирования на уровне
// React/браузера не подтверждён, но воспроизводится стабильно). Раз причина
// не установлена железно, страхуемся на самом нижнем уровне — если запрос с
// таким же URL+Authorization уже летит, возвращаем тот же промис вместо
// второго fetch. Ключ хранится, только пока запрос не завершился.
const inFlightRequests = new Map<string, Promise<ApiResult>>()

function dedupedFetch<T>(
  key: string,
  performFetch: () => Promise<ApiResult<T>>
): Promise<ApiResult<T>> {
  if (inFlightRequests.has(key)) return inFlightRequests.get(key) as Promise<ApiResult<T>>

  const promise = performFetch().finally(() => {
    inFlightRequests.delete(key)
  })

  inFlightRequests.set(key, promise as Promise<ApiResult>)
  return promise
}

interface BasicAuthOptions {
  username: string
  password: string
  params?: QueryParams
  headers?: Record<string, string>
}

// GET с Basic Auth — нужен только для auth-методов (loginAppUser,
// registerByPhone, confirmCode), пока ещё нет SESSIONID.
//
// headers — доп. HTTP-заголовки. Для registerByPhone/confirmCode DB_GUID
// передаётся именно так — заголовком "Params" со значением в виде JSON-
// строки (например '{"DB_GUID":"..."}'), а НЕ query-параметром
// Params[DB_GUID]=..., как для loginAppUser (см. authApi.js — там два разных
// метода передачи Params, оба подтверждены на реальных запросах 30.07.2026).
export async function getWithBasicAuth<T = unknown>(
  path: string,
  { username, password, params, headers }: BasicAuthOptions
): Promise<ApiResult<T>> {
  const url = buildUrl(path, params)
  const authHeader = `Basic ${btoa(`${username}:${password}`)}`
  const key = `${url}::${authHeader}`

  return dedupedFetch(key, async () => {
    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        ...headers,
      },
    })

    return parseResponse<T>(response)
  })
}

interface AuthorizedOptions {
  params?: QueryParams
}

// GET с Bearer SESSIONID — основной способ для всех методов после логина
// (Dashboard/*, SpecialRequests/* и т.д.)
export async function getAuthorized<T = unknown>(
  path: string,
  { params }: AuthorizedOptions = {}
): Promise<ApiResult<T>> {
  const sessionId = getSessionId()

  if (!sessionId) {
    throw new ApiError(401, 'Нет активной сессии — требуется повторный вход')
  }

  const response = await fetch(buildUrl(path, params), {
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  })

  return parseResponse<T>(response)
}
