package com.collabrix.dto.request;

import com.collabrix.enums.RelationshipType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ConnectionRequestDto(
        @NotBlank @Email String targetEmail,
        @NotNull RelationshipType relationshipType,
        @NotBlank String department,
        @NotBlank String account,
        @NotBlank String project,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {}
