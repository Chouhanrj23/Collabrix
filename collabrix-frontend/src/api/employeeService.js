import api from './axios'

/**
 * GET /api/employees
 * Returns: EmployeeDto[]
 *
 * GET /api/employees/{id}
 * Returns: EmployeeDto { id, username, name, email, designation, grade, department, joiningDate }
 *
 * GET /api/employees/departments
 * Returns: string[]  (distinct department names)
 *
 * GET /api/employees/{id}/reportees
 * Returns: EmployeeDto[]  (direct reports of the given employee)
 *
 * GET /api/employees/search?q={query}
 * Returns: EmployeeDto[]  (matches name, email, or username)
 */
export const employeeService = {
  getAll: () =>
    api.get('/employees').then((r) => r.data),

  getById: (id) =>
    api.get(`/employees/${id}`).then((r) => r.data),

  getDepartments: () =>
    api.get('/employees/departments').then((r) => r.data),

  getReportees: (id) =>
    api.get(`/employees/${id}/reportees`).then((r) => r.data),

  search: (query) =>
    api.get('/employees/search', { params: { q: query } }).then((r) => r.data),

  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/employees/upload-profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}
