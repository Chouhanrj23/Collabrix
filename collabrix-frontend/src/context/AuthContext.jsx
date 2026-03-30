import { createContext, useContext, useState, useCallback } from 'react'
import { authService } from '../api/authService'
import { TOKEN_KEY, USER_KEY } from '../api/storageKeys'

const AuthContext = createContext(null)

// ── Helpers ──────────────────────────────────────────────────────────────────

function readSession() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const raw = sessionStorage.getItem(USER_KEY)
    const user = raw ? JSON.parse(raw) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const { token, user } = readSession()
    return {
      token,
      user,
      isAuthenticated: !!(token && user),
    }
  })

  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const result = await authService.login(email, password)
      const token = result.token

      const user = {
        employeeId: result.employeeId,
        username: result.username,
        name: result.name,
        designation: result.designation,
        grade: result.grade,
        expiresIn: result.expiresIn
      }

      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      setState({ token, user, isAuthenticated: true })

      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setState({ token: null, user: null, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth()
 * Returns: { user, token, isAuthenticated, login, logout }
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
