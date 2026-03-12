package com.collabrix.dto.response;

import com.collabrix.enums.RelationshipType;

public record EdgeDto(
        String id,
        Long from,
        Long to,
        String label,
        String arrows,
        RelationshipType relationshipType,
        String since
) {}
