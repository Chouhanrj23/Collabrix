package com.collabrix.service;

import com.collabrix.dto.request.ConnectionRequestDto;
import com.collabrix.dto.response.ConnectionRequestResponseDto;
import com.collabrix.dto.response.EmployeeDto;
import com.collabrix.entity.ConnectionRequest;
import com.collabrix.entity.Employee;
import com.collabrix.enums.ConnectionStatus;
import com.collabrix.exception.DuplicateConnectionException;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.ConnectionRepository;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.util.DesignationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConnectionService {

        private final ConnectionRepository connectionRepository;
        private final EmployeeRepository employeeRepository;
        private final DesignationUtil designationUtil;

        public ConnectionRequestResponseDto createRequest(Long fromEmployeeId, ConnectionRequestDto dto) {
                Employee fromEmployee = employeeRepository.findById(fromEmployeeId)
                                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

                Employee toEmployee = employeeRepository.findByEmail(dto.targetEmail())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Target employee not found with email: " + dto.targetEmail()));

                connectionRepository.findDuplicatePendingRequest(
                                fromEmployeeId, toEmployee.getId(), dto.relationshipType().name()).ifPresent(r -> {
                                        throw new DuplicateConnectionException(
                                                        "A pending connection request already exists");
                                });

                ConnectionRequest request = ConnectionRequest.builder()
                                .fromEmployeeId(fromEmployeeId)
                                .toEmployeeId(toEmployee.getId())
                                .relationshipType(dto.relationshipType())
                                .status(ConnectionStatus.PENDING)
                                .department(dto.department())
                                .account(dto.account())
                                .project(dto.project())
                                .startDate(dto.startDate() != null ? dto.startDate().toString() : null)
                                .endDate(dto.endDate() != null ? dto.endDate().toString() : null)
                                .createdAt(LocalDateTime.now().toString())
                                .build();

                ConnectionRequest saved = Objects.requireNonNull(connectionRepository.save(request));
                return toResponseDto(saved, fromEmployee, toEmployee);
        }

        public ConnectionRequestResponseDto approveRequest(String requestId, Long currentEmployeeId) {
                ConnectionRequest request = connectionRepository.findById(requestId)
                                .orElseThrow(() -> new ResourceNotFoundException("Connection request not found"));

                if (!request.getToEmployeeId().equals(currentEmployeeId)) {
                        throw new UnauthorizedAccessException("Only the target employee can approve this request");
                }

                request.setStatus(ConnectionStatus.APPROVED);
                request.setResolvedAt(LocalDateTime.now().toString());
                connectionRepository.save(request);

                // Create the actual Neo4j relationship
                Employee fromEmployee = employeeRepository.findById(request.getFromEmployeeId())
                                .orElseThrow(() -> new ResourceNotFoundException("From employee not found"));
                Employee toEmployee = employeeRepository.findById(request.getToEmployeeId())
                                .orElseThrow(() -> new ResourceNotFoundException("To employee not found"));

                // Enforce Junior -> Senior relationship direction
                boolean isFromSenior = designationUtil.isSeniorTo(fromEmployee.getDesignation(),
                                toEmployee.getDesignation());
                Employee junior = isFromSenior ? toEmployee : fromEmployee;
                Employee senior = isFromSenior ? fromEmployee : toEmployee;

                addRelationship(junior, senior, request.getRelationshipType());
                employeeRepository.save(junior);

                return toResponseDto(request, fromEmployee, toEmployee);
        }

        public ConnectionRequestResponseDto rejectRequest(String requestId, Long currentEmployeeId) {
                ConnectionRequest request = connectionRepository.findById(requestId)
                                .orElseThrow(() -> new ResourceNotFoundException("Connection request not found"));

                if (!request.getToEmployeeId().equals(currentEmployeeId)) {
                        throw new UnauthorizedAccessException("Only the target employee can reject this request");
                }

                request.setStatus(ConnectionStatus.REJECTED);
                request.setResolvedAt(LocalDateTime.now().toString());
                connectionRepository.save(request);

                Employee fromEmployee = employeeRepository.findById(request.getFromEmployeeId())
                                .orElseThrow(() -> new ResourceNotFoundException("From employee not found"));
                Employee toEmployee = employeeRepository.findById(request.getToEmployeeId())
                                .orElseThrow(() -> new ResourceNotFoundException("To employee not found"));

                return toResponseDto(request, fromEmployee, toEmployee);
        }

        public List<ConnectionRequestResponseDto> getPendingRequests(Long employeeId) {
                return connectionRepository.findAllByToEmployeeIdAndStatus(employeeId, ConnectionStatus.PENDING).stream()
                                .map(this::toResponseDto)
                                .toList();
        }

        public List<ConnectionRequestResponseDto> getMyConnections(Long employeeId) {
                return connectionRepository.findApprovedConnectionsOf(employeeId).stream()
                                .map(this::toResponseDto)
                                .toList();
        }

        public List<ConnectionRequestResponseDto> getConnectionsOfEmployee(Long requesterId, Long targetId) {
                Employee requester = employeeRepository.findById(requesterId)
                                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));
                Employee target = employeeRepository.findById(targetId)
                                .orElseThrow(() -> new ResourceNotFoundException("Target employee not found"));

                if (!designationUtil.isSeniorTo(requester.getDesignation(), target.getDesignation())) {
                        throw new UnauthorizedAccessException(
                                        "You do not have permission to view this employee's connections");
                }

                return connectionRepository.findApprovedConnectionsOf(targetId).stream()
                                .map(this::toResponseDto)
                                .toList();
        }

        private void addRelationship(Employee junior, Employee senior, com.collabrix.enums.RelationshipType type) {
                switch (type) {
                        case REPORTING_PARTNER -> junior.getReportingPartners().add(senior);
                        case ENGAGEMENT_PARTNER -> junior.getEngagementPartners().add(senior);
                        case REPORTING_MANAGER -> junior.getReportingManagers().add(senior);
                        case ENGAGEMENT_MANAGER -> junior.getEngagementManagers().add(senior);
                        case INTERNAL_PRODUCT_DEVELOPMENT -> junior.getInternalProductDevelopment().add(senior);
                        case PEER -> junior.getPeers().add(senior);
                        case OTHERS -> junior.getOthers().add(senior);
                }
        }

        private ConnectionRequestResponseDto toResponseDto(ConnectionRequest request) {
                Employee from = employeeRepository.findById(request.getFromEmployeeId())
                                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                Employee to = employeeRepository.findById(request.getToEmployeeId())
                                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                return toResponseDto(request, from, to);
        }

        private ConnectionRequestResponseDto toResponseDto(ConnectionRequest request, Employee from, Employee to) {
                return new ConnectionRequestResponseDto(
                                request.getId(),
                                EmployeeDto.from(from),
                                EmployeeDto.from(to),
                                request.getRelationshipType(),
                                request.getStatus(),
                                request.getDepartment(),
                                request.getAccount(),
                                request.getProject(),
                                request.getStartDate(),
                                request.getEndDate(),
                                request.getCreatedAt(),
                                request.getResolvedAt());
        }
}
