package com.collabrix.enums;

public enum Grade {

    SENIOR,
    JUNIOR;

    public static Grade fromDesignation(Designation designation) {
        return switch (designation) {
            case DIRECTOR, PARTNER, MANAGER -> SENIOR;
            case SENIOR_CONSULTANT, CONSULTANT, ASSOCIATE_CONSULTANT -> JUNIOR;
        };
    }
}
