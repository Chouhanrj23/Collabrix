package com.collabrix.service;

import com.collabrix.dto.request.LoginRequest;
import com.collabrix.dto.response.AuthResponse;
import com.collabrix.entity.Employee;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private Employee buildTestEmployee() {
        return Employee.builder()
                .id(1L)
                .username("dilip")
                .name("Dilip Srinivas")
                .email("dilip@collabrix.com")
                .passwordHash("hashedPassword")
                .designation(Designation.DIRECTOR)
                .grade(Grade.SENIOR)
                .department("Software Engineering")
                .joiningDate(LocalDate.of(2016, 4, 1))
                .active(true)
                .build();
    }

    @Test
    void login_validCredentials_returnsAuthResponse() {
        Employee employee = buildTestEmployee();
        when(employeeRepository.findByEmail("dilip@collabrix.com")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("Admin@123", "hashedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(eq(1L), eq("dilip@collabrix.com"), eq("DIRECTOR"))).thenReturn("test-token");

        AuthResponse response = authService.login(new LoginRequest("dilip@collabrix.com", "Admin@123"));

        assertNotNull(response);
        assertEquals("test-token", response.token());
        assertEquals(1L, response.employeeId());
        assertEquals("dilip", response.username());
        assertEquals(Designation.DIRECTOR, response.designation());
    }

    @Test
    void login_wrongPassword_throwsUnauthorizedAccessException() {
        Employee employee = buildTestEmployee();
        when(employeeRepository.findByEmail("dilip@collabrix.com")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("wrong", "hashedPassword")).thenReturn(false);

        assertThrows(UnauthorizedAccessException.class,
                () -> authService.login(new LoginRequest("dilip@collabrix.com", "wrong")));
    }

    @Test
    void login_unknownEmail_throwsResourceNotFoundException() {
        when(employeeRepository.findByEmail("unknown@collabrix.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> authService.login(new LoginRequest("unknown@collabrix.com", "Admin@123")));
    }

    @Test
    void login_inactiveEmployee_throwsUnauthorizedAccessException() {
        Employee employee = buildTestEmployee();
        employee.setActive(false);
        when(employeeRepository.findByEmail("dilip@collabrix.com")).thenReturn(Optional.of(employee));
        when(passwordEncoder.matches("Admin@123", "hashedPassword")).thenReturn(true);

        assertThrows(UnauthorizedAccessException.class,
                () -> authService.login(new LoginRequest("dilip@collabrix.com", "Admin@123")));
    }
}
