package com.collabrix.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.time.LocalDateTime;

@Node("FeedbackRequest")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {

    @Id
    @GeneratedValue
    private Long id;

    private Long requestedByEmployeeId;
    private Long requestedFromEmployeeId;
    private String message;

    @Builder.Default
    private boolean fulfilled = false;

    private LocalDateTime requestedAt;
    private LocalDateTime fulfilledAt;
}
