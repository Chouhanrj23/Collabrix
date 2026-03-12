package com.collabrix.dto.request;

import jakarta.validation.constraints.*;

public record GiveFeedbackRequest(
        @NotNull Long toEmployeeId,
        @NotNull @Min(1) @Max(5) Integer rating,
        @NotBlank @Size(max = 1000) String comment,
        Long requestId
) {}
