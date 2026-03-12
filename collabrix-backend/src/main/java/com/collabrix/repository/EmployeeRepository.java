package com.collabrix.repository;

import com.collabrix.entity.Employee;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends Neo4jRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByUsername(String username);

    @Query("MATCH (e:Employee) WHERE e.account IS NOT NULL RETURN DISTINCT e.account")
    List<String> findDistinctAccounts();

    @Query("MATCH (r:Employee)-[:REPORTING_MANAGER|REPORTING_PARTNER]->(m:Employee) WHERE id(m) = $managerId RETURN r")
    List<Employee> findDirectReportees(Long managerId);

    @Query("MATCH (e:Employee)-[:REPORTING_PARTNER|ENGAGEMENT_PARTNER|REPORTING_MANAGER|ENGAGEMENT_MANAGER|INTERNAL_PRODUCT_DEVELOPMENT|PEER|OTHERS]->(c:Employee) WHERE id(e) = $employeeId RETURN c")
    List<Employee> findConnectionsOf(Long employeeId);

    @Query("MATCH (e:Employee) WHERE toLower(e.name) CONTAINS toLower($query) OR toLower(e.email) CONTAINS toLower($query) RETURN e LIMIT 10")
    List<Employee> findByNameOrEmailContaining(String query);
}
