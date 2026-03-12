package com.collabrix.service;

import com.collabrix.dto.request.LoginRequest;
import com.collabrix.dto.response.AuthResponse;
import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.entity.Employee;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${collabrix.jwt.expiration-ms}")
    private long jwtExpirationMs;

    public AuthResponse login(LoginRequest request) {
        Employee employee = employeeRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + request.email()));

        if (!passwordEncoder.matches(request.password(), employee.getPasswordHash())) {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        if (!employee.isActive()) {
            throw new UnauthorizedAccessException("Account is deactivated");
        }

        String token = jwtUtil.generateToken(
                employee.getId(),
                employee.getEmail(),
                employee.getDesignation().name()
        );

        return new AuthResponse(
                token,
                employee.getId(),
                employee.getUsername(),
                employee.getName(),
                employee.getDesignation(),
                employee.getGrade(),
                jwtExpirationMs
        );
    }

    public EmployeeDto getCurrentEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return EmployeeDto.from(employee);
    }
}
