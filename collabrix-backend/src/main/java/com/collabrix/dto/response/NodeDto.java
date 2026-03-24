package com.collabrix.dto.response;

import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;

public record NodeDto(
        Long id,
        String label,
        Designation designation,
        Grade grade,
        String color,
        String account,
        String project,
        String title,
        String profileImageUrl
) {
    public static NodeDto from(Employee e) {
        return new NodeDto(
                e.getId(),
                e.getName(),
                e.getDesignation(),
                e.getGrade(),
                colorFor(e.getDesignation()),
                e.getAccount(),
                e.getProject(),
                e.getDesignation().getDisplayName() + " - " + e.getAccount(),
                e.getProfileImageUrl()
        );
    }

    private static String colorFor(Designation d) {
        return switch (d) {
            case DIRECTOR -> "#8E44AD";
            case PARTNER -> "#F39C12";
            case MANAGER -> "#2E86C1";
            case SENIOR_CONSULTANT -> "#16A085";
            case CONSULTANT -> "#27AE60";
            case ASSOCIATE_CONSULTANT -> "#E74C3C";
        };
    }
}
