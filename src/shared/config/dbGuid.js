// DB_GUID передаётся в адресной строке приложения, например:
// https://.../#/?DB_GUID=3a166f27-77f9-4a0c-a732-84645966637d
//
// HashRouter кладёт query-параметры ПОСЛЕ хэша, поэтому обычный
// window.location.search (до хэша) их не увидит — разбираем именно
// строку после "#".
export function getDbGuidFromUrl() {
  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex === -1) return null

  const params = new URLSearchParams(hash.slice(queryIndex + 1))
  return params.get('DB_GUID')
}
