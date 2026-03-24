import axios from 'axios'

const TOKEN_KEY = 'collabrix_token'
const USER_KEY = 'collabrix_user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request interceptor ──────────────────────────────────────────────────────
// Attaches the JWT Bearer token to every outgoing request if one is stored.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Error normalizer ─────────────────────────────────────────────────────────
// Converts any Axios error into a plain Error with two extra fields:
//   err.message  — human-readable string (from backend or fallback)
//   err.status   — HTTP status code, or 0 for network failures
function normalizeError(error) {
  const status = error.response?.status ?? 0
  const data   = error.response?.data

  let message
  if (data?.message) {
    message = data.message
  } else if (data?.error) {
    message = data.error
  } else if (status === 0 || !error.response) {
    message = 'Network error — please check your connection.'
  } else if (status >= 500) {
    message = 'A server error occurred. Please try again later.'
  } else if (status === 403) {
    message = 'You do not have permission to perform this action.'
  } else if (status === 404) {
    message = 'The requested resource was not found.'
  } else {
    message = error.message || 'An unexpected error occurred.'
  }

  const normalized  = new Error(message)
  normalized.status = status
  return normalized
}

// ── Response interceptor ─────────────────────────────────────────────────────
// Pass-through on success.
// On 401 Unauthorized: clear session and redirect to /login.
// All other errors are normalized before rejection.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(normalizeError(error))
  }
)

export default api
