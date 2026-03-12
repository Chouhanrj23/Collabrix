package com.collabrix.dto.response;

import java.time.LocalDate;

public record FeedbackDto(
        Long id,
        EmployeeDto fromEmployee,
        EmployeeDto toEmployee,
        Integer rating,
        String comment,
        LocalDate feedbackDate
) {}
