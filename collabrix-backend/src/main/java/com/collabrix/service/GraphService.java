package com.collabrix.service;

import com.collabrix.dto.response.*;
import com.collabrix.entity.ConnectionRequest;
import com.collabrix.entity.Employee;
import com.collabrix.enums.ConnectionStatus;
import com.collabrix.exception.ResourceNotFoundException;
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

    private final ConnectionRepository connectionRepository;
    private final EmployeeRepository employeeRepository;
    private final DesignationUtil designationUtil;

    @Transactional(readOnly = true)
    public GraphDto getMyGraph(Long employeeId) {
        Employee centerEmployee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return buildGraph(centerEmployee);
    }

    @Transactional(readOnly = true)
    public GraphDto getFullGraph() {
        List<Employee> allEmployees = employeeRepository.findAll();
        Map<Long, NodeDto> nodeMap = new LinkedHashMap<>();
        for (Employee emp : allEmployees) {
            nodeMap.put(emp.getId(), NodeDto.from(emp));
        }

        List<EdgeDto> edges = new ArrayList<>();
        List<ConnectionRequest> allConnections = connectionRepository.findAllByStatus(ConnectionStatus.APPROVED);

        for (ConnectionRequest conn : allConnections) {
            NodeDto fromNode = nodeMap.get(conn.getFromEmployeeId());
            NodeDto toNode = nodeMap.get(conn.getToEmployeeId());
            String commonProjects = computeCommonProjects(
                    fromNode != null ? fromNode.project() : null,
                    toNode != null ? toNode.project() : null);
            String dept = conn.getDepartment() != null ? conn.getDepartment()
                    : (fromNode != null ? fromNode.department() : null);
            
            edges.add(new EdgeDto(
                    conn.getId(),
                    conn.getFromEmployeeId(),
                    conn.getToEmployeeId(),
                    conn.getRelationshipType().getDisplayName(),
                    "to",
                    conn.getRelationshipType(),
                    conn.getCreatedAt(),
                    dept,
                    conn.getAccount(),
                    commonProjects,
                    conn.getStartDate(),
                    conn.getEndDate(),
                    null,
                    conn.getStatus() != null ? conn.getStatus().name() : null));
        }

        return new GraphDto(new ArrayList<>(nodeMap.values()), edges);
    }

    @Transactional(readOnly = true)
    public GraphDto getEmployeeGraph(Long currentId, Long employeeId) {
        Employee targetEmployee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return buildGraph(targetEmployee);
    }

    @Transactional(readOnly = true)
    public ManagerDashboardDto getManagerDashboard(Long employeeId) {
        Employee manager = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        
        List<Employee> reportees = employeeRepository.findDirectReportees(employeeId);
        List<ConnectionRequest> pendingRequests = connectionRepository.findAllByToEmployeeIdAndStatus(employeeId, ConnectionStatus.PENDING);

        List<EmployeeDto> reporteeDtos = reportees.stream().map(EmployeeDto::from).toList();
        List<ConnectionRequestResponseDto> pendingRequestDtos = pendingRequests.stream()
                .map(req -> {
                    Employee fromEmp = employeeRepository.findById(req.getFromEmployeeId()).orElse(null);
                    return new ConnectionRequestResponseDto(
                        req.getId(),
                        fromEmp != null ? EmployeeDto.from(fromEmp) : null,
                        EmployeeDto.from(manager),
                        req.getRelationshipType(),
                        req.getStatus(),
                        req.getDepartment(),
                        req.getAccount(),
                        req.getProject(),
                        req.getStartDate(),
                        req.getEndDate(),
                        req.getCreatedAt(),
                        req.getResolvedAt()
                    );
                }).toList();

        List<ConnectionRequest> approvedConnections = connectionRepository.findApprovedConnectionsOf(employeeId);

        return new ManagerDashboardDto(
            reporteeDtos,
            pendingRequestDtos,
            approvedConnections.size()
        );
    }

    @Transactional(readOnly = true)
    public GraphDto getVisibleGraphForUser(Long currentEmployeeId) {
        Employee currentEmployee = employeeRepository.findById(currentEmployeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        int currentLevel = currentEmployee.getDesignation().getHierarchyLevel();

        List<ConnectionRequest> directConns = connectionRepository.findApprovedConnectionsOf(currentEmployeeId);
        List<ConnectionRequest> indirectConns = connectionRepository
                .findIndirectConnectionsForEmployee(currentEmployeeId, currentLevel);

        Set<Long> employeeIds = new HashSet<>();
        employeeIds.add(currentEmployeeId);
        for (ConnectionRequest conn : directConns) {
            employeeIds.add(conn.getFromEmployeeId());
            employeeIds.add(conn.getToEmployeeId());
        }
        for (ConnectionRequest conn : indirectConns) {
            employeeIds.add(conn.getFromEmployeeId());
            employeeIds.add(conn.getToEmployeeId());
        }

        Map<Long, Employee> employeeMap = new HashMap<>();
        for (Employee emp : employeeRepository.findAllById(employeeIds)) {
            employeeMap.put(emp.getId(), emp);
        }

        List<NodeDto> nodes = employeeIds.stream()
                .map(employeeMap::get)
                .filter(java.util.Objects::nonNull)
                .map(NodeDto::from)
                .toList();

        Set<String> seenIds = new HashSet<>();
        List<EdgeDto> edges = new ArrayList<>();
        List<ConnectionRequest> allConns = new ArrayList<>(directConns);
        allConns.addAll(indirectConns);
        for (ConnectionRequest conn : allConns) {
            if (!seenIds.add(conn.getId())) continue;
            Employee fromEmp = employeeMap.get(conn.getFromEmployeeId());
            Employee toEmp = employeeMap.get(conn.getToEmployeeId());
            String commonProjects = computeCommonProjects(
                    fromEmp != null ? fromEmp.getProject() : null,
                    toEmp != null ? toEmp.getProject() : null);
            String dept = conn.getDepartment() != null ? conn.getDepartment()
                    : (fromEmp != null ? fromEmp.getDepartment() : null);
            
            edges.add(new EdgeDto(
                    conn.getId(),
                    conn.getFromEmployeeId(),
                    conn.getToEmployeeId(),
                    conn.getRelationshipType().getDisplayName(),
                    "to",
                    conn.getRelationshipType(),
                    conn.getCreatedAt(),
                    dept,
                    conn.getAccount(),
                    commonProjects,
                    conn.getStartDate(),
                    conn.getEndDate(),
                    null,
                    conn.getStatus() != null ? conn.getStatus().name() : null));
        }

        return new GraphDto(nodes, edges);
    }

    private String computeCommonProjects(String p1, String p2) {
        if (p1 == null || p2 == null) return null;
        if (p1.equalsIgnoreCase(p2)) return p1;
        return null;
    }

    private GraphDto buildGraph(Employee centerEmployee) {
        Map<Long, NodeDto> nodeMap = new LinkedHashMap<>();
        List<EdgeDto> edges = new ArrayList<>();

        nodeMap.put(centerEmployee.getId(), NodeDto.from(centerEmployee));

        List<ConnectionRequest> approvedConnections = connectionRepository
                .findApprovedConnectionsOf(centerEmployee.getId());
        for (ConnectionRequest conn : approvedConnections) {
            Long otherId = conn.getFromEmployeeId().equals(centerEmployee.getId())
                    ? conn.getToEmployeeId()
                    : conn.getFromEmployeeId();

            if (!nodeMap.containsKey(otherId)) {
                Employee other = employeeRepository.findById(otherId).orElse(null);
                if (other != null) {
                    nodeMap.put(otherId, NodeDto.from(other));
                }
            }

            NodeDto fromNodeD = nodeMap.get(conn.getFromEmployeeId());
            NodeDto toNodeD = nodeMap.get(conn.getToEmployeeId());
            String commonProjectsD = computeCommonProjects(
                    fromNodeD != null ? fromNodeD.project() : null,
                    toNodeD != null ? toNodeD.project() : null);
            String deptD = conn.getDepartment() != null ? conn.getDepartment()
                    : (fromNodeD != null ? fromNodeD.department() : null);
            
            edges.add(new EdgeDto(
                    conn.getId(),
                    conn.getFromEmployeeId(),
                    conn.getToEmployeeId(),
                    conn.getRelationshipType().getDisplayName(),
                    "to",
                    conn.getRelationshipType(),
                    conn.getCreatedAt(),
                    deptD,
                    conn.getAccount(),
                    commonProjectsD,
                    conn.getStartDate(),
                    conn.getEndDate(),
                    null,
                    conn.getStatus() != null ? conn.getStatus().name() : null));
        }

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
                if (other == null) continue;

                if (!designationUtil.canViewConnections(centerEmployee.getDesignation(), other.getDesignation())) {
                    continue;
                }

                if (!nodeMap.containsKey(otherId)) {
                    nodeMap.put(otherId, NodeDto.from(other));
                }

                String edgeId = conn.getId() + "-r";
                boolean edgeExists = edges.stream().anyMatch(e -> e.id().equals(conn.getId()) || e.id().equals(edgeId));
                if (!edgeExists) {
                    NodeDto fromNodeR = nodeMap.get(conn.getFromEmployeeId());
                    NodeDto toNodeR = nodeMap.get(conn.getToEmployeeId());
                    String commonProjectsR = computeCommonProjects(
                            fromNodeR != null ? fromNodeR.project() : null,
                            toNodeR != null ? toNodeR.project() : null);
                    String deptR = conn.getDepartment() != null ? conn.getDepartment()
                            : (fromNodeR != null ? fromNodeR.department() : null);
                    
                    edges.add(new EdgeDto(
                            edgeId,
                            conn.getFromEmployeeId(),
                            conn.getToEmployeeId(),
                            conn.getRelationshipType().getDisplayName(),
                            "to",
                            conn.getRelationshipType(),
                            conn.getCreatedAt(),
                            deptR,
                            conn.getAccount(),
                            commonProjectsR,
                            conn.getStartDate(),
                            conn.getEndDate(),
                            null,
                            conn.getStatus() != null ? conn.getStatus().name() : null));
                }
            }
        }

        return new GraphDto(new ArrayList<>(nodeMap.values()), edges);
    }
}
