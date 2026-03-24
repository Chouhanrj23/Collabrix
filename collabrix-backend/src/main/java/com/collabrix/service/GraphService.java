package com.collabrix.service;

import com.collabrix.dto.response.*;
import com.collabrix.entity.ConnectionRequest;
import com.collabrix.entity.Employee;
import com.collabrix.exception.ResourceNotFoundException;
import com.collabrix.exception.UnauthorizedAccessException;
import com.collabrix.repository.ConnectionRepository;
import com.collabrix.repository.EmployeeRepository;
import com.collabrix.util.DesignationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GraphService {

    private final EmployeeRepository employeeRepository;
    private final ConnectionRepository connectionRepository;
    private final DesignationUtil designationUtil;

    @Transactional(readOnly = true)
    public GraphDto getMyGraph(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return buildGraph(employee);
    }

    @Transactional(readOnly = true)
    public GraphDto getEmployeeGraph(Long requesterId, Long targetId) {
        Employee requester = employeeRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found"));
        Employee target = employeeRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Target employee not found"));

        if (!designationUtil.isSeniorTo(requester.getDesignation(), target.getDesignation())) {
            throw new UnauthorizedAccessException("You do not have permission to view this employee's graph");
        }

        return buildGraph(target);
    }

    @Transactional(readOnly = true)
    public ManagerDashboardDto getManagerDashboard(Long managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        List<EmployeeDto> reportees = employeeRepository.findDirectReportees(managerId).stream()
                .map(EmployeeDto::from)
                .toList();

        List<ConnectionRequestResponseDto> pendingApprovals = connectionRepository
                .findPendingRequestsForEmployee(managerId).stream()
                .map(req -> {
                    Employee from = employeeRepository.findById(req.getFromEmployeeId())
                            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                    Employee to = employeeRepository.findById(req.getToEmployeeId())
                            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                    return new ConnectionRequestResponseDto(
                            req.getId(),
                            EmployeeDto.from(from),
                            EmployeeDto.from(to),
                            req.getRelationshipType(),
                            req.getStatus(),
                            req.getAccount(),
                            req.getProject(),
                            req.getDuration(),
                            req.getCreatedAt(),
                            req.getResolvedAt());
                })
                .toList();

        int totalConnections = connectionRepository.findApprovedConnectionsOf(managerId).size();

        return new ManagerDashboardDto(reportees, pendingApprovals, totalConnections);
    }

    @Transactional(readOnly = true)
    public GraphDto getFullGraph() {
        Map<Long, NodeDto> nodeMap = new LinkedHashMap<>();
        List<EdgeDto> edges = new ArrayList<>();

        // Add all employees as nodes
        for (Employee emp : employeeRepository.findAll()) {
            nodeMap.put(emp.getId(), NodeDto.from(emp));
        }

        // Add all approved connections as edges
        for (ConnectionRequest conn : connectionRepository.findAllApprovedConnections()) {
            edges.add(new EdgeDto(
                    conn.getId(),
                    conn.getFromEmployeeId(),
                    conn.getToEmployeeId(),
                    conn.getRelationshipType().getDisplayName(),
                    "to",
                    conn.getRelationshipType(),
                    conn.getCreatedAt() != null ? conn.getCreatedAt().toLocalDate().toString() : null));
        }

        return new GraphDto(new ArrayList<>(nodeMap.values()), edges);
    }

    private GraphDto buildGraph(Employee centerEmployee) {
        Map<Long, NodeDto> nodeMap = new LinkedHashMap<>();
        List<EdgeDto> edges = new ArrayList<>();

        // Add center node
        nodeMap.put(centerEmployee.getId(), NodeDto.from(centerEmployee));

        // Add direct connections from approved connection requests
        List<ConnectionRequest> approvedConnections = connectionRepository
                .findApprovedConnectionsOf(centerEmployee.getId());
        for (ConnectionRequest conn : approvedConnections) {
            Long otherId = conn.getFromEmployeeId().equals(centerEmployee.getId())
                    ? conn.getToEmployeeId()
                    : conn.getFromEmployeeId();

            if (!nodeMap.containsKey(otherId)) {
                Employee other = employeeRepository.findById(otherId)
                        .orElse(null);
                if (other != null) {
                    nodeMap.put(otherId, NodeDto.from(other));
                }
            }

            edges.add(new EdgeDto(
                    conn.getId(),
                    conn.getFromEmployeeId(),
                    conn.getToEmployeeId(),
                    conn.getRelationshipType().getDisplayName(),
                    "to",
                    conn.getRelationshipType(),
                    conn.getCreatedAt() != null ? conn.getCreatedAt().toLocalDate().toString() : null));
        }

        // Add reportees' connections (filtered by canViewConnections)
        List<Employee> reportees = employeeRepository.findDirectReportees(centerEmployee.getId());
        for (Employee reportee : reportees) {
            if (!nodeMap.containsKey(reportee.getId())) {
                nodeMap.put(reportee.getId(), NodeDto.from(reportee));
            }

            List<ConnectionRequest> reporteeConnections = connectionRepository
                    .findApprovedConnectionsOf(reportee.getId());
            for (ConnectionRequest conn : reporteeConnections) {
                Long otherId = conn.getFromEmployeeId().equals(reportee.getId())
                        ? conn.getToEmployeeId()
                        : conn.getFromEmployeeId();

                Employee other = employeeRepository.findById(otherId).orElse(null);
                if (other == null)
                    continue;

                // Filter: exclude connections to employees senior to the center employee
                if (!designationUtil.canViewConnections(centerEmployee.getDesignation(), other.getDesignation())) {
                    continue;
                }

                if (!nodeMap.containsKey(otherId)) {
                    nodeMap.put(otherId, NodeDto.from(other));
                }

                String edgeId = conn.getId() + "-r";
                boolean edgeExists = edges.stream().anyMatch(e -> e.id().equals(conn.getId()) || e.id().equals(edgeId));
                if (!edgeExists) {
                    edges.add(new EdgeDto(
                            edgeId,
                            conn.getFromEmployeeId(),
                            conn.getToEmployeeId(),
                            conn.getRelationshipType().getDisplayName(),
                            "to",
                            conn.getRelationshipType(),
                            conn.getCreatedAt() != null ? conn.getCreatedAt().toLocalDate().toString() : null));
                }
            }
        }

        return new GraphDto(new ArrayList<>(nodeMap.values()), edges);
    }
}
