package com.collabrix.service;

import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.dto.response.ProjectMembersDto;
import com.collabrix.dto.response.ProjectSummaryDto;
import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final EmployeeRepository employeeRepository;

    // ── READ ─────────────────────────────────────────────────────────────────

    /**
     * Returns all distinct project names with a count of how many employees
     * are assigned to each. The comma-separated project field is split in the
     * service layer; results are sorted alphabetically by project name.
     */
    @Transactional(readOnly = true)
    public List<ProjectSummaryDto> getProjectList() {
        List<Employee> employees = employeeRepository.findAllWithProjects();

        // Split comma-separated project strings, trim whitespace, group by name
        Map<String, Long> counts = employees.stream()
                .map(Employee::getProject)
                .filter(p -> p != null && !p.isBlank())
                .flatMap(p -> Arrays.stream(p.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty()))
                .collect(Collectors.groupingBy(
                        name -> name,
                        LinkedHashMap::new,
                        Collectors.counting()));

        return counts.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey, String.CASE_INSENSITIVE_ORDER))
                .map(e -> new ProjectSummaryDto(e.getKey(), Math.toIntExact(e.getValue())))
                .toList();
    }

    /**
     * Returns all employees whose project field contains {@code projectName}
     * (substring, case-sensitive — mirrors Neo4j CONTAINS semantics).
     *
     * @throws IllegalArgumentException if projectName is blank
     */
    @Transactional(readOnly = true)
    public ProjectMembersDto getProjectMembers(String projectName) {
        if (projectName == null || projectName.isBlank()) {
            throw new IllegalArgumentException("Project name must not be blank");
        }

        List<EmployeeDto> members = employeeRepository.findByProjectContaining(projectName.trim())
                .stream()
                .map(EmployeeDto::from)
                .toList();

        return new ProjectMembersDto(projectName.trim(), members);
    }

    // ── WRITE ────────────────────────────────────────────────────────────────

    /**
     * Updates the project field of a single employee.
     * Passing null or a blank string clears the field.
     *
     * @param requesterId ID of the authenticated user performing the change
     * @param employeeId  ID of the employee to update
     * @param project     New project value (may be null / blank to clear)
     * @return Updated employee as DTO
     * @throws UnauthorizedAccessException if requester is not Manager-level or above
     * @throws ResourceNotFoundException   if either employee is not found
     */
    @Transactional
    public EmployeeDto updateEmployeeProject(Long requesterId, Long employeeId, String project) {
        requireManagerOrAbove(requesterId);

        // Ensure target exists before updating
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        String trimmed = (project == null || project.isBlank()) ? null : project.trim();
        employeeRepository.updateProjectById(employeeId, trimmed);

        return EmployeeDto.from(employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId)));
    }

    /**
     * Bulk-renames a project across ALL employees whose project field contains
     * {@code oldName}. Uses Neo4j string replace — preserves other projects in
     * comma-separated lists (e.g. "AI in SDLC, Banking" → "AI Platform, Banking").
     *
     * @param requesterId ID of the authenticated user performing the change
     * @param oldName     Exact project name to find (must not be blank)
     * @param newName     Replacement name (must not be blank)
     * @return Number of employees whose project field was updated
     * @throws UnauthorizedAccessException if requester is not Manager-level or above
     * @throws IllegalArgumentException    if either name is blank or they are equal
     */
    @Transactional
    public int renameProject(Long requesterId, String oldName, String newName) {
        requireManagerOrAbove(requesterId);

        if (oldName == null || oldName.isBlank()) {
            throw new IllegalArgumentException("Old project name must not be blank");
        }
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("New project name must not be blank");
        }

        String trimmedOld = oldName.trim();
        String trimmedNew = newName.trim();

        if (trimmedOld.equals(trimmedNew)) {
            throw new IllegalArgumentException("New project name must differ from the old name");
        }

        // Count affected employees before rename for the response
        int affected = employeeRepository.findByProjectContaining(trimmedOld).size();

        if (affected > 0) {
            employeeRepository.renameProjectAcrossAll(trimmedOld, trimmedNew);
        }

        return affected;
    }

    // ── Authorization helper ──────────────────────────────────────────────────

    /**
     * Verifies that the requester holds a MANAGER-level or above designation
     * (PARTNER, DIRECTOR, or MANAGER — hierarchyLevel ≤ 3).
     */
    private void requireManagerOrAbove(Long requesterId) {
        Employee requester = employeeRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));

        Designation d = requester.getDesignation();
        if (d == null || d.getHierarchyLevel() > Designation.MANAGER.getHierarchyLevel()) {
            throw new UnauthorizedAccessException(
                    "Only MANAGER, DIRECTOR, or PARTNER can manage projects");
        }
    }
}
