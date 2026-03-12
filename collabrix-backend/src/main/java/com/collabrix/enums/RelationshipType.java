package com.collabrix.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RelationshipType {

    REPORTING_PARTNER("Reporting Partner"),
    ENGAGEMENT_PARTNER("Engagement Partner"),
    REPORTING_MANAGER("Reporting Manager"),
    ENGAGEMENT_MANAGER("Engagement Manager"),
    INTERNAL_PRODUCT_DEVELOPMENT("Internal Product Development"),
    PEER("Peer"),
    OTHERS("Others");

    private final String displayName;
}
