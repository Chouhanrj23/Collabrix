package com.collabrix.dto.response;

import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;

import java.time.LocalDate;

public record NodeDto(
        Long id,
        String label,
        Designation designation,
        Grade grade,
        String color,
        String department,
        String account,
        String project,
        LocalDate joiningDate,
        boolean active,
        String title,
        String profileImageUrl) {
    public static NodeDto from(Employee e) {
        Designation d = e.getDesignation();
        String dept = e.getDepartment();
        String displayTitle = d != null
                ? d.getDisplayName() + (dept != null ? " - " + dept : "")
                : (dept != null ? dept : "");
        return new NodeDto(
                e.getId(),
                e.getName(),
                d,
                e.getGrade(),
                d != null ? colorFor(d) : "#64748B",
                dept,
                e.getAccount(),
                e.getProject(),
                e.getJoiningDate(),
                e.isActive(),
                displayTitle,
                e.getProfileImageUrl());
    }

    private static String colorFor(Designation d) {
        return switch (d) {
            case DIRECTOR -> "#8E44AD";
            case PARTNER -> "#F39C12";
            case MANAGER -> "#2E86C1";
            case SENIOR_CONSULTANT -> "#16A085";
            case CONSULTANT -> "#27AE60";
            case ASSOCIATE -> "#E74C3C";
        };
    }
}

