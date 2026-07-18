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
