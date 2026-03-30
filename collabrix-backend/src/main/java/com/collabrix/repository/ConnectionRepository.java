package com.collabrix.repository;

import com.collabrix.entity.ConnectionRequest;
import com.collabrix.enums.ConnectionStatus;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends Neo4jRepository<ConnectionRequest, String> {

    List<ConnectionRequest> findAllByStatus(ConnectionStatus status);
    List<ConnectionRequest> findAllByToEmployeeIdAndStatus(Long toEmployeeId, ConnectionStatus status);

    @Query("MATCH (cr:ConnectionRequest) WHERE cr.status = 'APPROVED' AND (cr.fromEmployeeId = $employeeId OR cr.toEmployeeId = $employeeId) RETURN cr")
    List<ConnectionRequest> findApprovedConnectionsOf(Long employeeId);

    @Query("MATCH (cr:ConnectionRequest) WHERE cr.status = 'PENDING' AND cr.fromEmployeeId = $fromId AND cr.toEmployeeId = $toId AND cr.relationshipType = $relType RETURN cr LIMIT 1")
    Optional<ConnectionRequest> findDuplicatePendingRequest(Long fromId, Long toId, String relType);

    /**
     * Returns approved ConnectionRequests that are exactly 2 hops from the current user,
     * routed only through direct connections whose designation hierarchy level is >= currentLevel
     * (i.e. equal or junior designation).
     *
     * Designation rank mapping (lower number = more senior):
     *   PARTNER=1, DIRECTOR=2, MANAGER=3, SENIOR_CONSULTANT=4, CONSULTANT=5, ASSOCIATE=6
     *
     * Senior direct connections (rank < currentLevel) are intentionally excluded from expansion:
     * the current user can see they exist but cannot see their connections.
     */
    @Query("""
            MATCH (cr1:ConnectionRequest)
            WHERE cr1.status = 'APPROVED'
              AND (cr1.fromEmployeeId = $currentEmployeeId OR cr1.toEmployeeId = $currentEmployeeId)
            WITH cr1,
                 CASE WHEN cr1.fromEmployeeId = $currentEmployeeId
                      THEN cr1.toEmployeeId
                      ELSE cr1.fromEmployeeId
                 END AS directId
            MATCH (directEmp:Employee) WHERE id(directEmp) = directId
            WITH directId,
                 CASE directEmp.designation
                   WHEN 'PARTNER'              THEN 1
                   WHEN 'Partner'              THEN 1
                   WHEN 'DIRECTOR'             THEN 2
                   WHEN 'Director'             THEN 2
                   WHEN 'MANAGER'              THEN 3
                   WHEN 'Manager'              THEN 3
                   WHEN 'SENIOR_CONSULTANT'    THEN 4
                   WHEN 'Senior Consultant'    THEN 4
                   WHEN 'CONSULTANT'           THEN 5
                   WHEN 'Consultant'           THEN 5
                   WHEN 'ASSOCIATE'            THEN 6
                   WHEN 'Associate'            THEN 6
                   WHEN 'ASSOCIATE_CONSULTANT' THEN 6
                   WHEN 'Associate Consultant' THEN 6
                   ELSE 99
                 END AS directLevel
            WHERE directLevel >= $currentLevel
            MATCH (cr2:ConnectionRequest)
            WHERE cr2.status = 'APPROVED'
              AND (cr2.fromEmployeeId = directId OR cr2.toEmployeeId = directId)
              AND NOT (cr2.fromEmployeeId = $currentEmployeeId OR cr2.toEmployeeId = $currentEmployeeId)
            RETURN DISTINCT cr2
            """)
    List<ConnectionRequest> findIndirectConnectionsForEmployee(Long currentEmployeeId, int currentLevel);
}
