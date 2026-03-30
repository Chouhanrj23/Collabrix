package com.collabrix.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/projects/{oldName}/rename.
 */
public record RenameProjectRequest(
        @NotBlank(message = "New project name must not be blank")
        @Size(max = 200, message = "New project name must not exceed 200 characters")
        String newName) {
}
