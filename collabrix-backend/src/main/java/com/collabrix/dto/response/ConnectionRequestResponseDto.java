package com.collabrix.dto.response;

import com.collabrix.enums.ConnectionStatus;
import com.collabrix.enums.RelationshipType;

import java.time.LocalDateTime;

public record ConnectionRequestResponseDto(
        String id,
        EmployeeDto fromEmployee,
        EmployeeDto toEmployee,
        RelationshipType relationshipType,
        ConnectionStatus status,
        String account,
        String project,
        String duration,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {}
