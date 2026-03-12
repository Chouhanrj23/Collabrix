package com.collabrix.dto.response;

import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;

public record AuthResponse(
        String token,
        Long employeeId,
        String username,
        String name,
        Designation designation,
        Grade grade,
        long expiresIn
) {}
