package com.collabrix.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestFeedbackDto(
        @NotBlank @Email String requestFromEmail,
        @Size(max = 500) String message
) {}
