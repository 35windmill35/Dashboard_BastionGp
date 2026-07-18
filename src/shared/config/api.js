// Базовые константы API. BASE_URL можно будет переопределить через .env при
// переходе на прод-стенд (VITE_API_BASE_URL), сейчас — тестовый стенд.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-t3.basgroup.ru'

export const APP_CODE = 'ID_5817_DASHBOARD'
