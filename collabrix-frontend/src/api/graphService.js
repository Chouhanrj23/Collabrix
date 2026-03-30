import api from './axios'

/**
 * GET /api/graph/me
 * Returns: GraphDto { nodes: NodeDto[], edges: EdgeDto[] }
 *   NodeDto:  { id, label, designation, color, size }
 *   EdgeDto:  { from, to, label (RelationshipType), department, startDate, endDate }
 *
 * GET /api/graph/employee/{id}   (id is a Long)
 * Returns: GraphDto  (graph centered on the specified employee;
 *                     server enforces seniority-based visibility)
 *
 * GET /api/graph/manager-dashboard
 * Returns: ManagerDashboardDto {
 *   reportees:        EmployeeDto[]
 *   pendingApprovals: ConnectionRequestResponseDto[]
 *   totalConnections: number
 * }
 * NOTE: pendingApprovals here is equivalent to GET /api/connections/pending.
 * Prefer using dashboard.pendingApprovals rather than making a separate
 * connectionService.getPending() call on the Manager page.
 */
export const graphService = {
  getMyGraph: () =>
    api.get('/graph/me').then((r) => r.data),

  getFullGraph: () =>
    api.get('/graph/full').then((r) => r.data),

  getVisibleGraph: () =>
    api.get('/graph/visible').then((r) => r.data),


  getEmployeeGraph: (id) =>
    api.get(`/graph/employee/${id}`).then((r) => r.data),

  getManagerDashboard: () =>
    api.get('/graph/manager-dashboard').then((r) => r.data),
}
