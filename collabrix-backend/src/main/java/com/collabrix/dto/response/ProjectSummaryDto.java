package com.collabrix.dto.response;

/**
 * One entry in the GET /api/projects response.
 *
 * @param projectName  Distinct project name parsed from the comma-separated field.
 * @param memberCount  Number of employees whose project field contains this name.
 */
public record ProjectSummaryDto(String projectName, int memberCount) {
}
