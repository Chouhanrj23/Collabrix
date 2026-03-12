package com.collabrix.repository;

import com.collabrix.entity.FeedbackRequest;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRequestRepository extends Neo4jRepository<FeedbackRequest, Long> {

    List<FeedbackRequest> findByRequestedFromEmployeeIdAndFulfilledFalse(Long employeeId);

    List<FeedbackRequest> findByRequestedByEmployeeId(Long employeeId);
}
