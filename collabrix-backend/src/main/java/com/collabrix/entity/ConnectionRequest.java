package com.collabrix.entity;

import com.collabrix.enums.ConnectionStatus;
import com.collabrix.enums.RelationshipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.neo4j.driver.Value;
import org.neo4j.driver.Values;
import org.springframework.data.neo4j.core.convert.ConvertWith;
import org.springframework.data.neo4j.core.convert.Neo4jPersistentPropertyConverter;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

@Node("ConnectionRequest")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionRequest {

    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    private Long fromEmployeeId;
    private Long toEmployeeId;

    @ConvertWith(converter = RelationshipTypeConverter.class)
    private RelationshipType relationshipType;

    @ConvertWith(converter = ConnectionStatusConverter.class)
    @Builder.Default
    private ConnectionStatus status = ConnectionStatus.PENDING;

    private String account;
    private String project;
    private String duration;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    // --- Attribute Converters ---

    private static class RelationshipTypeConverter implements Neo4jPersistentPropertyConverter<RelationshipType> {
        @Override
        @NonNull
        public Value write(@Nullable RelationshipType type) {
            return type == null ? Values.NULL : Values.value(type.name());
        }

        @Override
        public RelationshipType read(@NonNull Value source) {
            return source.isNull() ? null : RelationshipType.valueOf(source.asString());
        }
    }

    private static class ConnectionStatusConverter implements Neo4jPersistentPropertyConverter<ConnectionStatus> {
        @Override
        @NonNull
        public Value write(@Nullable ConnectionStatus status) {
            return status == null ? Values.NULL : Values.value(status.name());
        }

        @Override
        public ConnectionStatus read(@NonNull Value source) {
            return source.isNull() ? null : ConnectionStatus.valueOf(source.asString());
        }
    }
}
