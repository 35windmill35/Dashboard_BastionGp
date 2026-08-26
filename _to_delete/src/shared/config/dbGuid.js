// DB_GUID приходит в адресной строке (до хэша или внутри hash-query, см.
// readFromLocation). Запоминаем в localStorage, чтобы он не терялся, если
// пользователь позже откроет /login без этого параметра в URL.
const DB_GUID_STORAGE_KEY = 'growing_points_db_guid'

function readFromLocation() {
  const fromSearch = new URLSearchParams(window.location.search || '').get('DB_GUID')
  if (fromSearch) return fromSearch

  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex === -1) return null

  const params = new URLSearchParams(hash.slice(queryIndex + 1))
  return params.get('DB_GUID')
}

export function getDbGuidFromUrl() {
  const fromUrl = readFromLocation()

  if (fromUrl) {
    localStorage.setItem(DB_GUID_STORAGE_KEY, fromUrl)
    return fromUrl
  }

  return localStorage.getItem(DB_GUID_STORAGE_KEY)
}
