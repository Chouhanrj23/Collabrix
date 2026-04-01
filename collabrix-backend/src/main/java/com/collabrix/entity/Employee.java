package com.collabrix.entity;

import com.collabrix.enums.Designation;
import com.collabrix.enums.Grade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.neo4j.driver.Value;
import org.neo4j.driver.Values;
import org.springframework.data.neo4j.core.convert.ConvertWith;
import org.springframework.data.neo4j.core.convert.Neo4jPersistentPropertyConverter;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Node("Employee")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue
    private Long id;

    private String username;
    private String name;
    private String email;
    private String passwordHash;

    @ConvertWith(converter = DesignationConverter.class)
    private Designation designation;

    @ConvertWith(converter = GradeConverter.class)
    private Grade grade;

    private String department;
    private String account;

    @ConvertWith(converter = LocalDateConverter.class)
    private LocalDate joiningDate;
    private String profileImageUrl;
    private String project;

    @Builder.Default
    private boolean active = true;

    @Relationship(type = "REPORTING_PARTNER", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> reportingPartners = new ArrayList<>();

    @Relationship(type = "ENGAGEMENT_PARTNER", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> engagementPartners = new ArrayList<>();

    @Relationship(type = "REPORTING_MANAGER", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> reportingManagers = new ArrayList<>();

    @Relationship(type = "ENGAGEMENT_MANAGER", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> engagementManagers = new ArrayList<>();

    @Relationship(type = "INTERNAL_PRODUCT_DEVELOPMENT", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> internalProductDevelopment = new ArrayList<>();

    @Relationship(type = "PEER", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> peers = new ArrayList<>();

    @Relationship(type = "OTHERS", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private List<Employee> others = new ArrayList<>();

    // --- Attribute Converters ---

    private static class DesignationConverter implements Neo4jPersistentPropertyConverter<Designation> {
        @Override
        @NonNull
        public Value write(@Nullable Designation designation) {
            return designation == null ? Values.NULL : Values.value(designation.name());
        }

        @Override
        public Designation read(@NonNull Value source) {
            if (source.isNull()) return null;
            // Normalise: trim, uppercase, replace spaces/hyphens with underscores
            // so that values like "Associate Consultant" or "Senior_Consultant" all resolve correctly.
            String val = source.asString().trim().toUpperCase().replace(" ", "_").replace("-", "_");
            if ("ASSOCIATE_CONSULTANT".equals(val)) return Designation.ASSOCIATE;
            try {
                return Designation.valueOf(val);
            } catch (IllegalArgumentException e) {
                return null; // unknown designation — load node gracefully rather than crashing
            }
        }
    }

    private static class GradeConverter implements Neo4jPersistentPropertyConverter<Grade> {
        @Override
        @NonNull
        public Value write(@Nullable Grade grade) {
            return grade == null ? Values.NULL : Values.value(grade.name());
        }

        @Override
        public Grade read(@NonNull Value source) {
            return source.isNull() ? null : Grade.valueOf(source.asString());
        }
    }

    private static class LocalDateConverter implements Neo4jPersistentPropertyConverter<LocalDate> {
        @Override
        @NonNull
        public Value write(@Nullable LocalDate date) {
            return date == null ? Values.NULL : Values.value(date.toString());
        }

        @Override
        public LocalDate read(@NonNull Value source) {
            if (source.isNull()) return null;
            try {
                return source.asLocalDate();
            } catch (Exception e) {
                return LocalDate.parse(source.asString());
            }
        }
    }
}
