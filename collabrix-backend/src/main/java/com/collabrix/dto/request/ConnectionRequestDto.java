package com.collabrix.dto.request;

import com.collabrix.enums.RelationshipType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConnectionRequestDto(
        @NotBlank @Email String targetEmail,
        @NotNull RelationshipType relationshipType,
        @NotBlank String account,
        @NotBlank String project,
        @NotBlank String duration
) {}
