package com.collabrix.service;

import com.collabrix.dto.request.ConnectionRequestDto;
import com.collabrix.dto.response.ConnectionRequestResponseDto;
import com.collabrix.entity.ConnectionRequest;
import com.collabrix.entity.Employee;
import com.collabrix.enums.ConnectionStatus;
import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;
import com.collabrix.enums.RelationshipType;
import com.collabrix.exception.DuplicateConnectionException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.ConnectionRepository;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.util.DesignationUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConnectionServiceTest {

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DesignationUtil designationUtil;

    @InjectMocks
    private ConnectionService connectionService;

    private Employee buildEmployee(Long id, String name, String email, Designation designation) {
        return Employee.builder()
                .id(id)
                .username(name.toLowerCase().split(" ")[0])
                .name(name)
                .email(email)
                .passwordHash("hash")
                .designation(designation)
                .grade(Grade.fromDesignation(designation))
                .account("TechCorp India")
                .project("ERP Modernisation")
                .joiningDate(LocalDate.of(2020, 1, 1))
                .active(true)
                .build();
    }

    @Test
    void createRequest_validEmployees_returnsPendingStatus() {
        Employee from = buildEmployee(1L, "Raj Chouhan", "raj@collabrix.com", Designation.CONSULTANT);
        Employee to = buildEmployee(2L, "Kratika Sharma", "kratika@collabrix.com", Designation.MANAGER);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(from));
        when(employeeRepository.findByEmail("kratika@collabrix.com")).thenReturn(Optional.of(to));
        when(connectionRepository.findDuplicatePendingRequest(1L, 2L, "REPORTING_MANAGER")).thenReturn(Optional.empty());
        when(connectionRepository.save(any(ConnectionRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ConnectionRequestDto dto = new ConnectionRequestDto("kratika@collabrix.com",
                RelationshipType.REPORTING_MANAGER, "TechCorp India", "ERP Modernisation", "2 years");

        ConnectionRequestResponseDto result = connectionService.createRequest(1L, dto);

        assertNotNull(result);
        assertEquals(ConnectionStatus.PENDING, result.status());
        assertEquals("Raj Chouhan", result.fromEmployee().name());
        assertEquals("Kratika Sharma", result.toEmployee().name());
    }

    @Test
    void createRequest_duplicatePending_throwsDuplicateConnectionException() {
        Employee from = buildEmployee(1L, "Raj Chouhan", "raj@collabrix.com", Designation.CONSULTANT);
        Employee to = buildEmployee(2L, "Kratika Sharma", "kratika@collabrix.com", Designation.MANAGER);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(from));
        when(employeeRepository.findByEmail("kratika@collabrix.com")).thenReturn(Optional.of(to));
        when(connectionRepository.findDuplicatePendingRequest(1L, 2L, "REPORTING_MANAGER"))
                .thenReturn(Optional.of(ConnectionRequest.builder().build()));

        ConnectionRequestDto dto = new ConnectionRequestDto("kratika@collabrix.com",
                RelationshipType.REPORTING_MANAGER, "TechCorp India", "ERP Modernisation", "2 years");

        assertThrows(DuplicateConnectionException.class,
                () -> connectionService.createRequest(1L, dto));
    }

    @Test
    void approveRequest_byCorrectEmployee_setsApproved() {
        ConnectionRequest request = ConnectionRequest.builder()
                .id("req-uuid-1")
                .fromEmployeeId(1L)
                .toEmployeeId(2L)
                .relationshipType(RelationshipType.REPORTING_MANAGER)
                .status(ConnectionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Employee from = buildEmployee(1L, "Raj Chouhan", "raj@collabrix.com", Designation.CONSULTANT);
        Employee to = buildEmployee(2L, "Kratika Sharma", "kratika@collabrix.com", Designation.MANAGER);

        when(connectionRepository.findById("req-uuid-1")).thenReturn(Optional.of(request));
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(from));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(to));
        when(connectionRepository.save(any(ConnectionRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        ConnectionRequestResponseDto result = connectionService.approveRequest("req-uuid-1", 2L);

        assertEquals(ConnectionStatus.APPROVED, result.status());
        assertNotNull(result.resolvedAt());
    }

    @Test
    void approveRequest_byWrongEmployee_throwsUnauthorizedAccessException() {
        ConnectionRequest request = ConnectionRequest.builder()
                .id("req-uuid-1")
                .fromEmployeeId(1L)
                .toEmployeeId(2L)
                .relationshipType(RelationshipType.REPORTING_MANAGER)
                .status(ConnectionStatus.PENDING)
                .build();

        when(connectionRepository.findById("req-uuid-1")).thenReturn(Optional.of(request));

        assertThrows(UnauthorizedAccessException.class,
                () -> connectionService.approveRequest("req-uuid-1", 99L));
    }
}
