package com.collabrix.repository;

import com.collabrix.entity.FeedbackRelationship;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends Neo4jRepository<FeedbackRelationship, Long> {

    List<FeedbackRelationship> findByToEmployeeId(Long toEmployeeId);

    List<FeedbackRelationship> findByFromEmployeeId(Long fromEmployeeId);
}
