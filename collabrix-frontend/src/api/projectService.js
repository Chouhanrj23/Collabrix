import api from './axios'

/**
 * GET /api/projects
 * Returns: ProjectSummaryDto[]  { projectName, memberCount }
 *
 * GET /api/projects/{projectName}/members
 * Returns: ProjectMembersDto   { projectName, members: EmployeeDto[] }
 *
 * PUT /api/employees/{id}/project
 * Body:    { project: string | null }
 * Returns: EmployeeDto (updated employee)
 *
 * PUT /api/projects/{oldName}/rename
 * Body:    { newName: string }
 * Returns: { affectedCount: number, message: string }
 */
export const projectService = {
  getProjects: () =>
    api.get('/projects').then((r) => r.data),

  getProjectMembers: (projectName) =>
    api.get(`/projects/${encodeURIComponent(projectName)}/members`).then((r) => r.data),

  updateEmployeeProject: (id, project) =>
    api.put(`/employees/${id}/project`, { project: project ?? null }).then((r) => r.data),

  renameProject: (oldName, newName) =>
    api.put(`/projects/${encodeURIComponent(oldName)}/rename`, { newName }).then((r) => r.data),
}
