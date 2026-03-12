package com.collabrix.controller;

import com.collabrix.dto.request.ConnectionRequestDto;
import com.collabrix.dto.response.ConnectionRequestResponseDto;
import com.collabrix.service.ConnectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/request")
    public ResponseEntity<ConnectionRequestResponseDto> createRequest(@Valid @RequestBody ConnectionRequestDto dto) {
        return ResponseEntity.ok(connectionService.createRequest(getCurrentEmployeeId(), dto));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<ConnectionRequestResponseDto> approveRequest(@PathVariable String id) {
        return ResponseEntity.ok(connectionService.approveRequest(id, getCurrentEmployeeId()));
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<ConnectionRequestResponseDto> rejectRequest(@PathVariable String id) {
        return ResponseEntity.ok(connectionService.rejectRequest(id, getCurrentEmployeeId()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ConnectionRequestResponseDto>> getPendingRequests() {
        return ResponseEntity.ok(connectionService.getPendingRequests(getCurrentEmployeeId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ConnectionRequestResponseDto>> getMyConnections() {
        return ResponseEntity.ok(connectionService.getMyConnections(getCurrentEmployeeId()));
    }

    @GetMapping("/employee/{id}")
    public ResponseEntity<List<ConnectionRequestResponseDto>> getConnectionsOfEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(connectionService.getConnectionsOfEmployee(getCurrentEmployeeId(), id));
    }

    private Long getCurrentEmployeeId() {
        return Long.parseLong((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
