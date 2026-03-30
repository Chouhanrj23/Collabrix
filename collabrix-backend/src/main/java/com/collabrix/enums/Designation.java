package com.collabrix.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Designation {

    PARTNER("Partner", 1),
    DIRECTOR("Director", 2),
    MANAGER("Manager", 3),
    SENIOR_CONSULTANT("Senior Consultant", 4),
    CONSULTANT("Consultant", 5),
    ASSOCIATE("Associate", 6);

    private final String displayName;
    private final int hierarchyLevel;

    public static boolean isSeniorTo(Designation a, Designation b) {
        return a.hierarchyLevel < b.hierarchyLevel;
    }
}

