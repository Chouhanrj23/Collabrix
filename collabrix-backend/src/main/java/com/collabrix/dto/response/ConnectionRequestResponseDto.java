package com.collabrix.dto.response;

import com.collabrix.enums.ConnectionStatus;
import com.collabrix.enums.RelationshipType;


public record ConnectionRequestResponseDto(
        String id,
        EmployeeDto fromEmployee,
        EmployeeDto toEmployee,
        RelationshipType relationshipType,
        ConnectionStatus status,
        String department,
        String account,
        String project,
        String startDate,
        String endDate,
        String createdAt,
        String resolvedAt
) {}
