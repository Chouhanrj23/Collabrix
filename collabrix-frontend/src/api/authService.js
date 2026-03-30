import api from './axios'

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Returns: AuthResponse { token, employeeId, username, name, designation, grade, expiresIn }
 *
 * GET /api/auth/me
 * Returns: EmployeeDto { id, username, name, email, designation, grade, department, joiningDate }
 */
export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  getMe: () =>
    api.get('/auth/me').then((r) => r.data),
}
