package com.collabrix.controller;

import com.collabrix.dto.request.LoginRequest;
import com.collabrix.dto.response.AuthResponse;
import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<EmployeeDto> me() {
        return ResponseEntity.ok(authService.getCurrentEmployee(getCurrentEmployeeId()));
    }

    private Long getCurrentEmployeeId() {
        return Long.parseLong((String) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }
}
