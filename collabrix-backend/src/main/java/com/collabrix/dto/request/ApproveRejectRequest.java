package com.collabrix.dto.request;

import com.collabrix.enums.ConnectionStatus;
import jakarta.validation.constraints.NotNull;

public record ApproveRejectRequest(
        @NotNull ConnectionStatus action
) {}
