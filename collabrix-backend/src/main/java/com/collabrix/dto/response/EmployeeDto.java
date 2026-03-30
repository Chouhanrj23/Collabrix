package com.collabrix.dto.response;

import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;

import java.time.LocalDate;

public record EmployeeDto(
        Long id,
        String username,
        String name,
        String email,
        Designation designation,
        Grade grade,
        String department,
        String account,
        LocalDate joiningDate,
        String profileImageUrl,
        String project,
        boolean active) {
    public static EmployeeDto from(Employee e) {
        return new EmployeeDto(
                e.getId(),
                e.getUsername(),
                e.getName(),
                e.getEmail(),
                e.getDesignation(),
                e.getGrade(),
                e.getDepartment(),
                e.getAccount(),
                e.getJoiningDate(),
                e.getProfileImageUrl(),
                e.getProject(),
                e.isActive());
    }
}
