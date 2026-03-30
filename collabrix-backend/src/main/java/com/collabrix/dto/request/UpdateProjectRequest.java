package com.collabrix.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/employees/{id}/project.
 * {@code project} may be null or empty to clear the field.
 */
public record UpdateProjectRequest(
        @Size(max = 500, message = "Project value must not exceed 500 characters")
        String project) {
}
