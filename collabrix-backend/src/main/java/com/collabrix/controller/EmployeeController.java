package com.collabrix.controller;

import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<EmployeeDto>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<String>> getDistinctAccounts() {
        return ResponseEntity.ok(employeeService.getDistinctAccounts());
    }

    @GetMapping("/{id}/reportees")
    public ResponseEntity<List<EmployeeDto>> getDirectReportees(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getDirectReportees(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<EmployeeDto>> searchEmployees(@RequestParam String q) {
        return ResponseEntity.ok(employeeService.searchEmployees(q));
    }

    @PostMapping("/upload-profile-pic")
    public ResponseEntity<Map<String, String>> uploadProfilePicture(@RequestParam("file") MultipartFile file) {
        String url = employeeService.uploadProfilePicture(getCurrentEmployeeId(), file);
        return ResponseEntity.ok(Map.of("profileImageUrl", url));
    }

    private Long getCurrentEmployeeId() {
        return Long.parseLong((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
