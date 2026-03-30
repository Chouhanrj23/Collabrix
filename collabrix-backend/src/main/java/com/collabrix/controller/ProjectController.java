package com.collabrix.controller;

import com.collabrix.dto.request.RenameProjectRequest;
import com.collabrix.dto.request.UpdateProjectRequest;
import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.dto.response.ProjectMembersDto;
import com.collabrix.dto.response.ProjectSummaryDto;
import com.collabrix.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Project Management REST API.
 *
 * GET  /api/projects                      → all authenticated users
 * GET  /api/projects/{projectName}/members → all authenticated users
 * PUT  /api/employees/{id}/project        → MANAGER / DIRECTOR / PARTNER only
 * PUT  /api/projects/{oldName}/rename     → MANAGER / DIRECTOR / PARTNER only
 *
 * Authorization for write operations is enforced in the service layer
 * (designation check against the authenticated employee record).
 */
@Validated
@RestController
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ── GET /api/projects ────────────────────────────────────────────────────

    /**
     * Returns all distinct project names with member counts, sorted
     * alphabetically. Project names are parsed from the comma-separated
     * {@code project} field on Employee nodes.
     */
    @GetMapping("/api/projects")
    public ResponseEntity<List<ProjectSummaryDto>> getAllProjects() {
        return ResponseEntity.ok(projectService.getProjectList());
    }

    // ── GET /api/projects/{projectName}/members ──────────────────────────────

    /**
     * Returns all employees whose {@code project} field contains the given
     * project name (Neo4j CONTAINS — substring, case-sensitive).
     */
    @GetMapping("/api/projects/{projectName}/members")
    public ResponseEntity<ProjectMembersDto> getProjectMembers(
            @PathVariable String projectName) {
        return ResponseEntity.ok(projectService.getProjectMembers(projectName));
    }

    // ── PUT /api/employees/{id}/project ──────────────────────────────────────

    /**
     * Overwrites the project field for a single employee.
     * Pass an empty or blank {@code project} value to clear the field.
     * Requires MANAGER-level or above designation.
     */
    @PutMapping("/api/employees/{id}/project")
    public ResponseEntity<EmployeeDto> updateEmployeeProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request) {
        EmployeeDto updated = projectService.updateEmployeeProject(
                getCurrentEmployeeId(), id, request.project());
        return ResponseEntity.ok(updated);
    }

    // ── PUT /api/projects/{oldName}/rename ───────────────────────────────────

    /**
     * Bulk-renames a project across all employees.
     * Uses Neo4j {@code replace()} so composite project strings such as
     * "AI in SDLC, Banking" are updated correctly to "AI Platform, Banking".
     * Requires MANAGER-level or above designation.
     *
     * @return 200 with {@code { "affectedCount": N, "message": "..." }}
     */
    @PutMapping("/api/projects/{oldName}/rename")
    public ResponseEntity<Map<String, Object>> renameProject(
            @PathVariable String oldName,
            @Valid @RequestBody RenameProjectRequest request) {
        int affected = projectService.renameProject(
                getCurrentEmployeeId(), oldName, request.newName());
        return ResponseEntity.ok(Map.of(
                "affectedCount", affected,
                "message", "Project '" + oldName + "' renamed to '" + request.newName()
                           + "' across " + affected + " employee(s)"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Long getCurrentEmployeeId() {
        return Long.parseLong(
                (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
