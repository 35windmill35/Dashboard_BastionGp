// Хранилище текущей сессии. Простое, на модульной переменной + persist в
// localStorage — этого достаточно для одного залогиненного пользователя в
// одной вкладке. AuthStore (entities/user) дергает эти функции при логине/
// выходе, httpClient — при каждом запросе, чтобы подставить SESSIONID.

const STORAGE_KEY = 'growing_points_session'

let sessionId = null
let remaining = null

export function setSession({ sessionId: id, remaining: r }) {
  sessionId = id
  remaining = r
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: id, remaining: r, savedAt: Date.now() }))
}

export function getSessionId() {
  if (sessionId) return sessionId
  restoreFromStorage()
  return sessionId
}

export function clearSession() {
  sessionId = null
  remaining = null
  localStorage.removeItem(STORAGE_KEY)
}

function restoreFromStorage() {
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
