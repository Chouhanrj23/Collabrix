package com.collabrix.controller;

import com.collabrix.dto.response.GraphDto;
import com.collabrix.dto.response.ManagerDashboardDto;
import com.collabrix.enums.Designation;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.service.GraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/graph")
@RequiredArgsConstructor
public class GraphController {

    private final GraphService graphService;
    private final EmployeeRepository employeeRepository;

    @GetMapping("/me")
    public ResponseEntity<GraphDto> getMyGraph() {
        return ResponseEntity.ok(graphService.getMyGraph(getCurrentEmployeeId()));
    }

    @GetMapping("/full")
    public ResponseEntity<GraphDto> getFullGraph() {
        long currentId = getCurrentEmployeeId();
        Designation designation = employeeRepository.findById(currentId)
                .map(e -> e.getDesignation())
                .orElseThrow(() -> new UnauthorizedAccessException("Unauthorized"));
        if (designation.getHierarchyLevel() > Designation.MANAGER.getHierarchyLevel()) {
            throw new UnauthorizedAccessException("Full graph access is restricted to managers and above");
        }
        return ResponseEntity.ok(graphService.getFullGraph());
    }

    @GetMapping("/visible")
    public ResponseEntity<GraphDto> getVisibleGraph() {
        return ResponseEntity.ok(graphService.getVisibleGraphForUser(getCurrentEmployeeId()));
    }


    @GetMapping("/employee/{id}")
    public ResponseEntity<GraphDto> getEmployeeGraph(@PathVariable Long id) {
        return ResponseEntity.ok(graphService.getEmployeeGraph(getCurrentEmployeeId(), id));
    }

    @GetMapping("/manager-dashboard")
    public ResponseEntity<ManagerDashboardDto> getManagerDashboard() {
        return ResponseEntity.ok(graphService.getManagerDashboard(getCurrentEmployeeId()));
    }

    private Long getCurrentEmployeeId() {
        return Long.parseLong((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
