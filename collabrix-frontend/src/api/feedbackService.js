import api from './axios'

/**
 * POST /api/feedback/give
 * Body: {
 *   toEmployeeId: number   (Long — recipient employee ID)
 *   rating:       number   (integer 1–5)
 *   comment:      string   (max 1000 chars)
 *   requestId?:   number   (Long — optional, links to a pending feedback request)
 * }
 * Returns: FeedbackDto { id, fromEmployee, toEmployee, rating, comment, feedbackDate }
 *
 * POST /api/feedback/request
 * Body: {
 *   requestFromEmail: string   (email of the employee being asked to give feedback)
 *   message?:         string   (optional note, max 500 chars)
 * }
 * Returns: void (HTTP 200 with empty body)
 *
 * GET /api/feedback/received
 * Returns: FeedbackDto[]  (feedback received by the current user)
 *
 * GET /api/feedback/pending-requests
 * Returns: FeedbackDto[]  (feedback requests directed at the current user, not yet fulfilled)
 *
 * FeedbackDto shape:
 * { id, fromEmployee: EmployeeDto, toEmployee: EmployeeDto, rating, comment, feedbackDate }
 */
export const feedbackService = {
  give: (data) =>
    api.post('/feedback/give', data).then((r) => r.data),

  request: (data) =>
    api.post('/feedback/request', data).then((r) => r.data),

  getReceived: () =>
    api.get('/feedback/received').then((r) => r.data),

  getGiven: () =>
    api.get('/feedback/given').then((r) => r.data),

  getReceivedForEmployee: (employeeId) =>
    api.get(`/feedback/received/${employeeId}`).then((r) => r.data),

  getPendingRequests: () =>
    api.get('/feedback/pending-requests').then((r) => r.data),
}
