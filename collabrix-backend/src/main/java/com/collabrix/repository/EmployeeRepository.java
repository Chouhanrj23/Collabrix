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

    @Query("MATCH (e:Employee) WHERE e.department IS NOT NULL RETURN DISTINCT e.department")
    List<String> findDistinctDepartments();

    @Query("MATCH (r:Employee)-[:REPORTING_MANAGER|REPORTING_PARTNER]->(m:Employee) WHERE id(m) = $managerId RETURN r")
    List<Employee> findDirectReportees(Long managerId);

    @Query("MATCH (e:Employee)-[:REPORTING_PARTNER|ENGAGEMENT_PARTNER|REPORTING_MANAGER|ENGAGEMENT_MANAGER|INTERNAL_PRODUCT_DEVELOPMENT|PEER|OTHERS]->(c:Employee) WHERE id(e) = $employeeId RETURN c")
    List<Employee> findConnectionsOf(Long employeeId);

    @Query("MATCH (e:Employee) WHERE toLower(e.name) CONTAINS toLower($query) OR toLower(e.email) CONTAINS toLower($query) RETURN e LIMIT 10")
    List<Employee> findByNameOrEmailContaining(String query);

    // ── Project management queries ────────────────────────────────────────────

    /** All employees that have at least one project assigned. */
    @Query("MATCH (e:Employee) WHERE e.project IS NOT NULL AND e.project <> '' RETURN e")
    List<Employee> findAllWithProjects();

    /** Employees whose project field contains the given name (substring match). */
    @Query("MATCH (e:Employee) WHERE e.project CONTAINS $name RETURN e")
    List<Employee> findByProjectContaining(String name);

    /** Overwrite a single employee's project field (pass null to clear). */
    @Query("MATCH (e:Employee) WHERE id(e) = $id SET e.project = $project")
    void updateProjectById(Long id, String project);

    /**
     * Bulk rename: replaces every occurrence of {@code oldName} with
     * {@code newName} in the project field of matching employees.
     */
    @Query("MATCH (e:Employee) WHERE e.project CONTAINS $oldName " +
           "SET e.project = replace(e.project, $oldName, $newName)")
    void renameProjectAcrossAll(String oldName, String newName);
}
