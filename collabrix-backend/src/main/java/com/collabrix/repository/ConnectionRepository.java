package com.collabrix.repository;

import com.collabrix.entity.ConnectionRequest;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends Neo4jRepository<ConnectionRequest, String> {

    @Query("MATCH (cr:ConnectionRequest) WHERE cr.status = 'PENDING' AND cr.toEmployeeId = $employeeId RETURN cr")
    List<ConnectionRequest> findPendingRequestsForEmployee(Long employeeId);

    @Query("MATCH (cr:ConnectionRequest) WHERE cr.status = 'APPROVED' AND (cr.fromEmployeeId = $employeeId OR cr.toEmployeeId = $employeeId) RETURN cr")
    List<ConnectionRequest> findApprovedConnectionsOf(Long employeeId);

    @Query("MATCH (cr:ConnectionRequest) WHERE cr.status = 'PENDING' AND cr.fromEmployeeId = $fromId AND cr.toEmployeeId = $toId AND cr.relationshipType = $relType RETURN cr LIMIT 1")
    Optional<ConnectionRequest> findDuplicatePendingRequest(Long fromId, Long toId, String relType);

    @Query("MATCH (cr:ConnectionRequest) WHERE cr.status = 'APPROVED' RETURN cr")
    List<ConnectionRequest> findAllApprovedConnections();
}
