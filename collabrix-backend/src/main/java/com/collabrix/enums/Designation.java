package com.collabrix.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Designation {

    DIRECTOR("Director", 6),
    PARTNER("Partner", 5),
    MANAGER("Manager", 4),
    SENIOR_CONSULTANT("Senior Consultant", 3),
    CONSULTANT("Consultant", 2),
    ASSOCIATE_CONSULTANT("Associate Consultant", 1);

    private final String displayName;
    private final int hierarchyLevel;

    public static boolean isSeniorTo(Designation a, Designation b) {
        return a.hierarchyLevel > b.hierarchyLevel;
    }
}
