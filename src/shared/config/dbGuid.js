// DB_GUID передаётся в адресной строке приложения. Поддерживаем два формата:
//
// 1. https://.../?DB_GUID=3a166f27-77f9-4a0c-a732-84645966637d#/login
//    Обычный query-параметр ДО хэша — реально уходит на сервер как часть
//    URL, поэтому переживает серверные редиректы (в частности, ссылки,
//    открытые через встроенный браузер мессенджера/соцсети — Instagram,
//    WhatsApp и т.п. часто заворачивают внешние ссылки через свой
//    редирект-сервис, а тот в принципе не видит хэш: фрагмент после "#"
//    никогда не отправляется на сервер, поэтому его теряют почти все такие
//    обёртки). Этот формат — приоритетный, проверяем его первым.
//
// 2. https://.../#/?DB_GUID=3a166f27-77f9-4a0c-a732-84645966637d
//    Старый формат из примера в ТЗ — DB_GUID внутри хэша (HashRouter кладёт
//    query-параметры именно туда). Оставлен как fallback для обратной
//    совместимости с уже разосланными ссылками такого вида.
export function getDbGuidFromUrl() {
  const fromSearch = new URLSearchParams(window.location.search || '').get('DB_GUID')
  if (fromSearch) return fromSearch

  const hash = window.location.hash || ''
  const queryIndex = hash.indexOf('?')
  if (queryIndex === -1) return null

  const params = new URLSearchParams(hash.slice(queryIndex + 1))
  return params.get('DB_GUID')
}
