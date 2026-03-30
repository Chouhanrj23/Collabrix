package com.collabrix.dto.response;

import java.util.List;

/**
 * Response for GET /api/projects/{projectName}/members.
 *
 * @param projectName Name of the project as it appears in the URL / search term.
 * @param members     All employees whose project field contains {@code projectName}.
 */
public record ProjectMembersDto(String projectName, List<EmployeeDto> members) {
}
