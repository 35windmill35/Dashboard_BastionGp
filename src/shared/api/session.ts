// Хранилище текущей сессии. Простое, на модульной переменной + persist в
// localStorage — этого достаточно для одного залогиненного пользователя в
// одной вкладке. AuthStore (entities/user) дергает эти функции при логине/
// выходе, httpClient — при каждом запросе, чтобы подставить SESSIONID.

const STORAGE_KEY = 'growing_points_session'

let sessionId: string | null = null
let remaining: number | null = null

interface SetSessionArgs {
  sessionId: string | null
  remaining: number | null
}

export function setSession({ sessionId: id, remaining: r }: SetSessionArgs): void {
  sessionId = id
  remaining = r
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ sessionId: id, remaining: r, savedAt: Date.now() })
  )
}

export function getSessionId(): string | null {
  if (sessionId) return sessionId
  restoreFromStorage()
  return sessionId
}

// remaining нигде в приложении пока не читается (сохраняется "на будущее",
// как и в исходном JS-коде) — геттер добавлен только для строгого TS
// (noUnusedLocals), поведение не меняет.
export function getRemaining(): number | null {
  return remaining
}

export function clearSession(): void {
  sessionId = null
  remaining = null
  localStorage.removeItem(STORAGE_KEY)
}

function restoreFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    sessionId = parsed.sessionId
    remaining = parsed.remaining
  } catch {
    clearSession()
  }
}
