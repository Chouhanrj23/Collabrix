package com.collabrix.controller;

import com.collabrix.dto.response.GraphDto;
import com.collabrix.dto.response.ManagerDashboardDto;
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

    @GetMapping("/me")
    public ResponseEntity<GraphDto> getMyGraph() {
        return ResponseEntity.ok(graphService.getMyGraph(getCurrentEmployeeId()));
    }

    @GetMapping("/full")
    public ResponseEntity<GraphDto> getFullGraph() {
        return ResponseEntity.ok(graphService.getFullGraph());
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
