import api from './axios'

/**
 * POST /api/connections/request
 * Body: {
 *   targetEmail:      string          (email of the employee to connect with)
 *   relationshipType: string          (enum: REPORTING_PARTNER | ENGAGEMENT_PARTNER |
 *                                           REPORTING_MANAGER | ENGAGEMENT_MANAGER |
 *                                           INTERNAL_PRODUCT_DEVELOPMENT | PEER | OTHERS)
 *   account:          string
 *   project:          string
 *   duration:         string
 * }
 * Returns: ConnectionRequestResponseDto
 *
 * PUT /api/connections/approve/{id}    (id is a String UUID)
 * Returns: ConnectionRequestResponseDto
 *
 * PUT /api/connections/reject/{id}     (id is a String UUID)
 * Returns: ConnectionRequestResponseDto
 *
 * GET /api/connections/pending
 * Returns: ConnectionRequestResponseDto[]  (requests pending current user's approval)
 *
 * GET /api/connections/my
 * Returns: ConnectionRequestResponseDto[]  (all requests sent or received by current user)
 *
 * GET /api/connections/employee/{id}   (id is a Long)
 * Returns: ConnectionRequestResponseDto[]  (connections of the specified employee,
 *                                           access controlled server-side by seniority)
 *
 * ConnectionRequestResponseDto shape:
 * { id, fromEmployee: EmployeeDto, toEmployee: EmployeeDto, relationshipType,
 *   status (PENDING|APPROVED|REJECTED), account, project, duration, createdAt, resolvedAt }
 */
export const connectionService = {
  request: (data) =>
    api.post('/connections/request', data).then((r) => r.data),

  approve: (id) =>
    api.put(`/connections/approve/${id}`).then((r) => r.data),

  reject: (id) =>
    api.put(`/connections/reject/${id}`).then((r) => r.data),

  getPending: () =>
    api.get('/connections/pending').then((r) => r.data),

  getMy: () =>
    api.get('/connections/my').then((r) => r.data),

  getByEmployee: (id) =>
    api.get(`/connections/employee/${id}`).then((r) => r.data),
}
