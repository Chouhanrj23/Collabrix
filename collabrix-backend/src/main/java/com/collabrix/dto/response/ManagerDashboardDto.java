package com.collabrix.dto.response;

import java.util.List;

public record ManagerDashboardDto(
        List<EmployeeDto> reportees,
        List<ConnectionRequestResponseDto> pendingApprovals,
        int totalConnections
) {}
