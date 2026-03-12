package com.collabrix.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.time.LocalDate;

@Node("Feedback")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRelationship {

    @Id
    @GeneratedValue
    private Long id;

    private Long fromEmployeeId;
    private Long toEmployeeId;
    private Integer rating;
    private String comment;
    private LocalDate feedbackDate;
    private boolean isResponse;
    private Long requestId;
}
